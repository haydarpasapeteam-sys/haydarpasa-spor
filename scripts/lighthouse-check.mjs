#!/usr/bin/env node
/**
 * Reproducible Lighthouse audit against the real production build,
 * served exactly as GitHub Pages serves it (under the `/haydarpasa-spor/`
 * base path) via `astro preview`. Not a fabricated/estimated number —
 * every score printed here comes from an actual Lighthouse run against a
 * locally running copy of the same static output that gets deployed.
 *
 * Usage (server must already be running — see README's Testing section):
 *   pnpm run build
 *   pnpm run preview &
 *   node scripts/lighthouse-check.mjs
 *
 * Or via the npm script: `pnpm run lighthouse` (documented in README).
 *
 * Exits non-zero if any route fails its threshold, so this can gate CI —
 * see the "Lighthouse audit" step in .github/workflows/validate.yml.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT_DIR = join(ROOT, 'lighthouse-reports');
const BASE_URL = process.env.LIGHTHOUSE_BASE_URL ?? 'http://localhost:4321/haydarpasa-spor';

// Thresholds from spec §20. CLS is checked separately since it's a raw
// metric, not a 0-100 category score.
const THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 95,
};
const CLS_MAX = 0.1;

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'egitim-ve-rehber', path: '/egitim-ve-rehber/' },
];

mkdirSync(OUT_DIR, { recursive: true });

let failed = false;
const summary = [];

for (const route of ROUTES) {
  const url = `${BASE_URL}${route.path}`;
  const outputPath = join(OUT_DIR, `${route.name}.json`);

  execFileSync(
    process.execPath,
    [
      join(ROOT, 'node_modules', 'lighthouse', 'cli', 'index.js'),
      url,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--output=json',
      `--output-path=${outputPath}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--throttling-method=simulate',
      '--quiet',
    ],
    { stdio: 'inherit' },
  );

  const report = JSON.parse(readFileSync(outputPath, 'utf8'));
  const scores = Object.fromEntries(
    Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
  );
  const cls = report.audits['cumulative-layout-shift']?.numericValue ?? null;

  console.log(`\n[lighthouse-check] ${route.name} (${url})`);
  for (const [category, threshold] of Object.entries(THRESHOLDS)) {
    const score = scores[category];
    const ok = score >= threshold;
    console.log(`  ${ok ? '✓' : '✗'} ${category}: ${score} (threshold ${threshold})`);
    if (!ok) failed = true;
  }
  const clsOk = cls !== null && cls < CLS_MAX;
  console.log(`  ${clsOk ? '✓' : '✗'} CLS: ${cls?.toFixed(4)} (threshold < ${CLS_MAX})`);
  if (!clsOk) failed = true;

  summary.push({ route: route.name, ...scores, cls });
}

console.log(`\n[lighthouse-check] Full JSON reports written to ${OUT_DIR}/`);
console.log(JSON.stringify(summary, null, 2));

if (failed) {
  console.error('\n[lighthouse-check] One or more routes fell below threshold.');
  process.exit(1);
}
console.log('\n[lighthouse-check] All routes met their thresholds.');
