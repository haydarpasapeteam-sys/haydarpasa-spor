#!/usr/bin/env node
/**
 * Deterministic build-time image optimization (spec §12 "Initial download
 * size" / §7 image pipeline).
 *
 * Reads every original image committed under public/media/images/ (this is
 * where Pages CMS uploads land — see .pages.yml media config) and produces:
 *   - resized WebP + AVIF derivatives at a small set of widths
 *   - a JSON manifest (public/media/images/_manifest.json) mapping each
 *     original's root-relative path to its derivatives + intrinsic
 *     width/height, consumed by src/components/ui/ResponsiveImage.astro
 *     to render a <picture> with srcset and explicit dimensions (no CLS).
 *
 * Idempotent and cacheable: re-running only regenerates a derivative whose
 * source file's mtime/size changed since the manifest was last written, so
 * `pnpm run optimize:images` is cheap to run on every CI build (see
 * .github/workflows/*.yml cache config for node_modules/.cache).
 */
import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES_DIR = join(ROOT, 'public', 'media', 'images');
const DERIVED_DIR = join(IMAGES_DIR, '_derived');
const MANIFEST_PATH = join(IMAGES_DIR, '_manifest.json');
const WIDTHS = [480, 800, 1200];
const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.name.startsWith('_')) return []; // skip _derived/, _manifest.json
    if (entry.isDirectory()) return walk(full);
    return SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase()) ? [full] : [];
  });
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function processImage(absPath, manifest) {
  const relFromImagesDir = relative(IMAGES_DIR, absPath); // e.g. duyurular/foo.png
  const publicPath = `/media/images/${relFromImagesDir.split(/[\\/]/).join('/')}`;
  const stat = statSync(absPath);
  const cacheKey = `${stat.size}:${Math.floor(stat.mtimeMs)}`;

  const existing = manifest[publicPath];
  if (existing && existing.cacheKey === cacheKey) {
    return { publicPath, entry: existing, skipped: true };
  }

  const base = basename(relFromImagesDir, extname(relFromImagesDir));
  const outDir = join(DERIVED_DIR, dirname(relFromImagesDir));
  mkdirSync(outDir, { recursive: true });

  const source = sharp(absPath);
  const meta = await source.metadata();
  const intrinsicWidth = meta.width ?? 1200;
  const intrinsicHeight = meta.height ?? 800;

  const variants = [];
  const widthsToGenerate = WIDTHS.filter((w) => w < intrinsicWidth);
  widthsToGenerate.push(intrinsicWidth); // always include a full-width variant

  for (const width of [...new Set(widthsToGenerate)].sort((a, b) => a - b)) {
    for (const format of ['avif', 'webp']) {
      const filename = `${base}-${width}.${format}`;
      const outPath = join(outDir, filename);
      const resized = sharp(absPath).resize({ width, withoutEnlargement: true });
      const encoded = format === 'avif' ? resized.avif({ quality: 55 }) : resized.webp({ quality: 72 });
      await encoded.toFile(outPath);
      variants.push({
        width,
        format,
        path: `/media/images/${relative(IMAGES_DIR, outPath).split(/[\\/]/).join('/')}`,
      });
    }
  }

  return {
    publicPath,
    entry: { width: intrinsicWidth, height: intrinsicHeight, cacheKey, variants },
    skipped: false,
  };
}

async function main() {
  const sources = walk(IMAGES_DIR);
  const manifest = loadManifest();
  let generated = 0;
  let cached = 0;

  for (const absPath of sources) {
    const { publicPath, entry, skipped } = await processImage(absPath, manifest);
    manifest[publicPath] = entry;
    if (skipped) cached++;
    else generated++;
  }

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[optimize-images] ${sources.length} kaynak görsel — ${generated} yeniden üretildi, ${cached} önbellekten kullanıldı.`);
}

main();
