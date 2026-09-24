#!/usr/bin/env node
/**
 * Document integrity gate — run before every build.
 *
 * Every "Belgeler" content entry's `file` must exist, be non-zero bytes,
 * and start with a real %PDF- signature (not just have a .pdf extension).
 * Also defensively scans the whole public/media/documents/ tree so a
 * zero-byte or corrupt PDF can never reach production even if no content
 * entry references it, and confirms the known-empty legacy PDF
 * (ogrenci_taahhutnamesi.pdf) stays out of public/ entirely.
 */
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadAllEntries, relPath, ROOT } from './lib/content.mjs';

const errors = [];
const PDF_SIGNATURE = Buffer.from('%PDF-');

function checkPdf(file, absPath) {
  if (!existsSync(absPath)) {
    errors.push(`${relPath(file)}: dosya bulunamadı: ${relPath(absPath)}`);
    return;
  }
  const stat = statSync(absPath);
  if (stat.size === 0) {
    errors.push(`${relPath(file)}: dosya 0 bayt (boş PDF yayınlanamaz): ${relPath(absPath)}`);
    return;
  }
  const head = readFileSync(absPath).subarray(0, 5);
  if (!head.equals(PDF_SIGNATURE)) {
    errors.push(`${relPath(file)}: geçerli bir %PDF- imzasıyla başlamıyor: ${relPath(absPath)}`);
  }
}

// 1. Every "Aktif"/"Taslak"/"Güncelliğini Kaybetti" document entry must have a real, valid file.
//    ("Dosya Bekleniyor" entries are exempt by definition — but no such entry should exist
//    in src/content/documents at all; see the defensive check below.)
const entries = loadAllEntries().filter((e) => e.collection === 'documents');
for (const { file, data } of entries) {
  if (data.status === 'Dosya Bekleniyor') {
    errors.push(`${relPath(file)}: status "Dosya Bekleniyor" olan bir belge Belgeler koleksiyonunda YAYINLANAMAZ — içerik koleksiyonundan tamamen çıkarılmalı (bkz. pending-documents/).`);
    continue;
  }
  checkPdf(file, join(ROOT, 'public', data.file));
}

// 2. Defensive sweep: every PDF actually sitting in public/media/documents/, referenced or not.
const documentsDir = join(ROOT, 'public', 'media', 'documents');
if (existsSync(documentsDir)) {
  for (const filename of readdirSync(documentsDir)) {
    if (!filename.toLowerCase().endsWith('.pdf')) continue;
    checkPdf(join(documentsDir, filename), join(documentsDir, filename));
  }
}

// 3. The known-empty legacy PDF must never be reachable from public/.
const leakPath = join(ROOT, 'public', 'media', 'documents', 'ogrenci-taahhutnamesi.pdf');
if (existsSync(leakPath)) {
  errors.push(`${relPath(leakPath)}: ogrenci_taahhutnamesi.pdf (bilinen 0 bayt dosya) public/ altına sızdı — bkz. pending-documents/.`);
}
const pendingPath = join(ROOT, 'pending-documents', 'ogrenci-taahhutnamesi-BEKLENIYOR.pdf');
if (!existsSync(pendingPath)) {
  errors.push(`pending-documents/ogrenci-taahhutnamesi-BEKLENIYOR.pdf bulunamadı — eksik öğrenci taahhütnamesi izlenemiyor olabilir.`);
} else if (statSync(pendingPath).size !== 0) {
  console.log('[validate-documents] Not: ogrenci-taahhutnamesi-BEKLENIYOR.pdf artık 0 bayt değil — okul gerçek belgeyi sağlamış olabilir. Belgeler koleksiyonuna eklemeyi değerlendirin.');
}

if (errors.length > 0) {
  console.error(`\n[validate-documents] ${errors.length} sorun bulundu:\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error('');
  process.exit(1);
}
console.log(`[validate-documents] OK — ${entries.length} belge kaydı ve public/media/documents/ dizini doğrulandı.`);
