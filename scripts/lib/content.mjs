/**
 * Shared content-loading helper for the standalone validation scripts
 * (scripts/validate-*.mjs). These run as plain Node scripts *before*
 * `astro build` (see package.json's `build` script), so they cannot import
 * `astro:content` — they parse the same markdown + YAML frontmatter files
 * directly with the `yaml` package instead.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

export const ROOT = new URL('../..', import.meta.url).pathname;
export const CONTENT_DIR = join(ROOT, 'src', 'content');
export const COLLECTIONS = ['announcements', 'sports', 'teams', 'matches', 'tournaments', 'documents', 'galleries'];

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseEntry(raw, filePath) {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) {
    throw new Error(`${filePath}: geçerli bir frontmatter (---...---) bulunamadı.`);
  }
  const data = parseYaml(match[1]) ?? {};
  const body = match[2] ?? '';
  return { data, body: body.trim() };
}

/** @returns {{ collection: string, slug: string, file: string, data: any, body: string }[]} */
export function loadAllEntries() {
  const entries = [];
  for (const collection of COLLECTIONS) {
    const dir = join(CONTENT_DIR, collection);
    if (!existsSync(dir)) continue;
    for (const filename of readdirSync(dir)) {
      if (!filename.endsWith('.md') || filename.startsWith('_')) continue;
      const file = join(dir, filename);
      const raw = readFileSync(file, 'utf8');
      const { data, body } = parseEntry(raw, file);
      const slug = filename.replace(/\.md$/, '');
      entries.push({ collection, slug, file, data, body });
    }
  }
  return entries;
}

export function relPath(file) {
  return file.startsWith(ROOT) ? file.slice(ROOT.length) : file;
}
