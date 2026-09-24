#!/usr/bin/env node
/**
 * Link/reference integrity gate — run before every build.
 *
 * Hard failures (exit 1): local media files that don't exist on disk, and
 * cross-collection references (sport/relatedDocument/relatedMatch/
 * relatedTournament) that point at a slug nobody defined.
 *
 * External URLs are only ever a soft warning here, never a hard failure —
 * per spec §20, an authentication-protected Google Form/Drive link
 * returning 401/403 to an anonymous automated request is expected
 * behaviour, not a broken link, and a flaky network shouldn't be able to
 * block every production build.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadAllEntries, relPath, ROOT } from './lib/content.mjs';

const errors = [];
const warnings = [];
const CHECK_EXTERNAL = process.env.VALIDATE_EXTERNAL_LINKS === '1';

const entries = loadAllEntries();
const bySlug = new Map(); // "collection:slug" -> entry
for (const e of entries) bySlug.set(`${e.collection}:${e.slug}`, e);

function checkLocalMedia(file, publicRelativePath) {
  const abs = join(ROOT, 'public', publicRelativePath);
  if (!existsSync(abs)) {
    errors.push(`${relPath(file)}: yerel medya bulunamadı: "${publicRelativePath}" (public${publicRelativePath})`);
  }
}

function checkReference(file, field, targetCollection, targetSlug) {
  if (targetSlug === undefined) return;
  if (!bySlug.has(`${targetCollection}:${targetSlug}`)) {
    errors.push(`${relPath(file)}: ${field} bilinmeyen bir "${targetCollection}" kaydına işaret ediyor: "${targetSlug}"`);
  }
}

const externalUrls = new Set();

for (const { collection, file, data } of entries) {
  if (data.coverImage) checkLocalMedia(file, data.coverImage);
  if (collection === 'documents' && data.file) checkLocalMedia(file, data.file);

  if (data.sport) checkReference(file, 'sport', 'sports', data.sport);
  if (data.relatedDocument) checkReference(file, 'relatedDocument', 'documents', data.relatedDocument);
  if (data.relatedMatch) checkReference(file, 'relatedMatch', 'matches', data.relatedMatch);
  if (data.relatedTournament) checkReference(file, 'relatedTournament', 'tournaments', data.relatedTournament);
  if (data.fixtureDocument) checkReference(file, 'fixtureDocument', 'documents', data.fixtureDocument);

  for (const urlField of ['relatedUrl', 'applicationUrl', 'staffApplicationUrl', 'resultsUrl', 'externalUrl', 'galleryUrl']) {
    if (data[urlField]) externalUrls.add(data[urlField]);
  }
}

if (CHECK_EXTERNAL && externalUrls.size > 0) {
  console.log(`[validate-links] ${externalUrls.size} dış bağlantı kontrol ediliyor (VALIDATE_EXTERNAL_LINKS=1)...`);
  for (const url of externalUrls) {
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      if (!res.ok && res.status !== 401 && res.status !== 403) {
        warnings.push(`${url} -> HTTP ${res.status}`);
      }
    } catch (err) {
      warnings.push(`${url} -> ulaşılamadı (${err.message})`);
    }
  }
}

if (warnings.length > 0) {
  console.warn(`\n[validate-links] ${warnings.length} uyarı (build engellenmez — 401/403 kimlik doğrulama gerektiren Google bağlantıları için beklenen bir durumdur):\n`);
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (errors.length > 0) {
  console.error(`\n[validate-links] ${errors.length} sorun bulundu:\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error('');
  process.exit(1);
}
console.log(`[validate-links] OK — ${entries.length} kayıt, ${externalUrls.size} dış bağlantı tarandı.`);
