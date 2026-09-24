#!/usr/bin/env node
/**
 * Content validation gate — run before every build (see package.json's
 * `validate` / `build` scripts and .github/workflows/validate.yml).
 * Exits non-zero (and prints every problem found) if any rule from
 * spec §18 is violated. This is a standalone pass over the raw markdown
 * files (see scripts/lib/content.mjs) so it also catches mistakes the
 * Zod schemas in src/content.config.ts would only report during
 * `astro build`, earlier and with a clearer Turkish error list.
 */
import { readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { loadAllEntries, relPath, ROOT } from './lib/content.mjs';

const errors = [];
function fail(file, message) {
  errors.push(`${relPath(file)}: ${message}`);
}

const SAFE_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:']);
function isSafeUrl(value) {
  try {
    return SAFE_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REQUIRED_FIELDS = {
  announcements: ['title', 'slug', 'summary', 'category', 'status', 'publishAt'],
  sports: ['name', 'slug', 'icon', 'description'],
  teams: ['name', 'slug', 'sport', 'season', 'ageOrClassGroup', 'summary'],
  matches: ['title', 'slug', 'sport', 'competition', 'season', 'homeTeam', 'awayTeam', 'dateTime', 'venue', 'status'],
  tournaments: ['title', 'slug', 'sport', 'season', 'status', 'summary'],
  documents: ['title', 'slug', 'category', 'summary', 'file', 'versionDate', 'schoolYear', 'status'],
  galleries: ['title', 'slug', 'year', 'event', 'description'],
};
const ANNOUNCEMENT_CATEGORIES = ['Duyuru', 'Takım Seçmeleri', 'Turnuva', 'Maç Sonucu', 'Belge', 'Etkinlik'];
const ANNOUNCEMENT_STATUSES = ['Taslak', 'Yayınlandı', 'Arşivlendi'];
const MATCH_STATUSES = ['Planlandı', 'Canlı', 'Tamamlandı', 'Ertelendi', 'İptal Edildi'];
const DOCUMENT_STATUSES = ['Taslak', 'Aktif', 'Güncelliğini Kaybetti', 'Dosya Bekleniyor'];

const entries = loadAllEntries();
const slugsPerCollection = new Map();

for (const { collection, slug, file, data } of entries) {
  // 1. Required fields present.
  for (const field of REQUIRED_FIELDS[collection] ?? []) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      fail(file, `zorunlu alan eksik: "${field}"`);
    }
  }

  // 2. Slug validity + filename/frontmatter match + duplicates.
  if (typeof data.slug === 'string' && !SLUG_RE.test(data.slug)) {
    fail(file, `geçersiz slug biçimi: "${data.slug}" (yalnızca a-z, 0-9, tire)`);
  }
  if (data.slug !== undefined && data.slug !== slug) {
    fail(file, `slug alanı ("${data.slug}") dosya adıyla ("${slug}") eşleşmiyor`);
  }
  const set = slugsPerCollection.get(collection) ?? new Set();
  if (set.has(slug)) fail(file, `"${collection}" koleksiyonunda tekrarlanan slug: "${slug}"`);
  set.add(slug);
  slugsPerCollection.set(collection, set);

  // 3. Cover image / alt text pairing + allowed media directory.
  if (data.coverImage) {
    if (!data.coverImageAlt) fail(file, 'coverImage var ama coverImageAlt (Görsel Açıklaması) eksik');
    if (!String(data.coverImage).startsWith('/media/images/')) {
      fail(file, `coverImage izin verilen dizin dışında: "${data.coverImage}" (yalnızca /media/images/)`);
    }
  }

  // 4. Dates must be valid and, where present, expiresAt >= publishAt.
  for (const dateField of ['publishAt', 'expiresAt', 'dateTime', 'startDate', 'endDate', 'applicationStart', 'applicationEnd', 'versionDate']) {
    if (data[dateField] !== undefined && Number.isNaN(new Date(data[dateField]).getTime())) {
      fail(file, `geçersiz tarih: ${dateField} = "${data[dateField]}"`);
    }
  }
  if (data.publishAt && data.expiresAt && new Date(data.expiresAt) < new Date(data.publishAt)) {
    fail(file, 'expiresAt (Yayından Kalkma Tarihi), publishAt (Yayın Tarihi) değerinden önce olamaz');
  }
  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    fail(file, 'endDate, startDate değerinden önce olamaz');
  }

  // 5. Collection-specific enum + business rules.
  if (collection === 'announcements') {
    if (data.category && !ANNOUNCEMENT_CATEGORIES.includes(data.category)) fail(file, `geçersiz category: "${data.category}"`);
    if (data.status && !ANNOUNCEMENT_STATUSES.includes(data.status)) fail(file, `geçersiz status: "${data.status}"`);
    if (data.relatedUrl && !isSafeUrl(data.relatedUrl)) fail(file, `relatedUrl geçersiz protokol: "${data.relatedUrl}"`);
  }
  if (collection === 'matches') {
    if (data.status && !MATCH_STATUSES.includes(data.status)) fail(file, `geçersiz status: "${data.status}"`);
    if (typeof data.homeTeam === 'string' && typeof data.awayTeam === 'string' &&
        data.homeTeam.trim().toLowerCase() === data.awayTeam.trim().toLowerCase()) {
      fail(file, 'bir takım kendisiyle eşleşemez (homeTeam === awayTeam)');
    }
    for (const scoreField of ['homeScore', 'awayScore']) {
      const v = data[scoreField];
      if (v !== undefined && (!Number.isInteger(v) || v < 0)) {
        fail(file, `${scoreField} negatif olmayan bir tam sayı olmalı, bulunan: ${JSON.stringify(v)}`);
      }
    }
    if (data.status === 'Tamamlandı' && (data.homeScore === undefined || data.awayScore === undefined)) {
      fail(file, 'Tamamlandı durumundaki bir maçın hem homeScore hem awayScore değeri olmalı');
    }
    if (data.galleryUrl && !isSafeUrl(data.galleryUrl)) fail(file, `galleryUrl geçersiz protokol: "${data.galleryUrl}"`);
  }
  if (collection === 'documents') {
    if (data.status && !DOCUMENT_STATUSES.includes(data.status)) fail(file, `geçersiz status: "${data.status}"`);
    if (data.file && !String(data.file).startsWith('/media/documents/')) {
      fail(file, `file izin verilen dizin dışında: "${data.file}" (yalnızca /media/documents/)`);
    }
    if (data.status === 'Aktif' && !data.approved) {
      fail(file, 'status "Aktif" olan bir belge approved=true olmalı');
    }
  }
  if (collection === 'tournaments') {
    if (data.applicationUrl && !isSafeUrl(data.applicationUrl)) fail(file, `applicationUrl geçersiz protokol: "${data.applicationUrl}"`);
    if (data.staffApplicationUrl && !isSafeUrl(data.staffApplicationUrl)) fail(file, `staffApplicationUrl geçersiz protokol: "${data.staffApplicationUrl}"`);
    if (data.resultsUrl && !isSafeUrl(data.resultsUrl)) fail(file, `resultsUrl geçersiz protokol: "${data.resultsUrl}"`);
  }
  if (collection === 'galleries') {
    if (data.externalUrl && !isSafeUrl(data.externalUrl)) fail(file, `externalUrl geçersiz protokol: "${data.externalUrl}"`);
  }
}

// 6. Repository-wide: no leftover [cite: N] citation artifacts anywhere.
try {
  const grep = execSync(
    String.raw`grep -rn "\[cite:" --include=*.md --include=*.astro --include=*.html . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=scripts || true`,
    { cwd: ROOT, encoding: 'utf8' },
  ).trim();
  if (grep) {
    fail(join(ROOT, '(repo geneli)'), `"[cite:" kalıntısı bulundu:\n${grep}`);
  }
} catch {
  /* grep exits non-zero only on real errors here since `|| true` is appended; nothing to do. */
}

// 7. No executables/archives in public/media.
const DANGEROUS_EXT = ['.exe', '.sh', '.bat', '.cmd', '.zip', '.rar', '.7z', '.app', '.dmg', '.jar', '.msi'];
const mediaRoot = join(ROOT, 'public', 'media');
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}
for (const file of walk(mediaRoot)) {
  if (DANGEROUS_EXT.some((ext) => file.toLowerCase().endsWith(ext))) {
    fail(file, 'public/media altında izin verilmeyen dosya türü (çalıştırılabilir/arşiv)');
  }
}

// ---------------------------------------------------------------------------
if (errors.length > 0) {
  console.error(`\n[validate-content] ${errors.length} sorun bulundu:\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error('');
  process.exit(1);
}
console.log(`[validate-content] OK — ${entries.length} içerik dosyası doğrulandı, sorun yok.`);
