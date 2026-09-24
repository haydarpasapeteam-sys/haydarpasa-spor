#!/usr/bin/env node
/**
 * Structural regression check for .pages.yml against Pages CMS's
 * documented configuration schema (verified against
 * https://pagescms.org/docs/configuration/* on 2026-09-24 — see the
 * comment block at the top of .pages.yml).
 *
 * This is NOT an official Pages CMS validator/JSON Schema — Pages CMS
 * does not publish one. It codifies the specific structural rules this
 * project's config relies on, so a future edit that reintroduces a
 * wrong-shape field (e.g. a bare `options: [...]` array on a `select`
 * field instead of `options.values`, or `options.source` instead of
 * `options.media` on an image/file field) fails CI instead of silently
 * breaking the editor UI at runtime.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const config = parse(readFileSync(`${ROOT}.pages.yml`, 'utf8'));
const errors = [];

function fail(where, message) {
  errors.push(`${where}: ${message}`);
}

const mediaNames = new Set((config.media ?? []).map((m) => m.name));
for (const media of config.media ?? []) {
  if (!media.name) fail('media', 'bir medya kaynağının "name" alanı eksik');
  if (!media.input) fail(`media.${media.name}`, '"input" alanı eksik');
  if (!media.output) fail(`media.${media.name}`, '"output" alanı eksik');
}

const collectionNames = new Set(
  (config.content ?? []).filter((c) => c.type === 'collection').map((c) => c.name),
);

const VALID_OPERATION_KEYS = new Set(['create', 'rename', 'delete']);
const VALID_SORT_ORDER = new Set(['asc', 'desc']);
const VALID_COMMIT_KEYS = new Set(['create', 'update', 'delete', 'rename']);

function checkField(where, field) {
  const label = `${where} > field "${field.name}"`;
  if (!field.name) fail(where, 'bir alanın "name" değeri eksik');
  if (!field.type && !field.component) fail(label, '"type" veya "component" belirtilmemiş');

  if (field.type === 'select') {
    const opts = field.options;
    if (!opts || Array.isArray(opts) || !Array.isArray(opts.values)) {
      fail(
        label,
        'select alanı doğrudan bir dizi ("options: [...]") DEĞİL, "options.values: [...]" biçiminde olmalı',
      );
    }
  }

  if (field.type === 'image' || field.type === 'file') {
    const opts = field.options;
    if (!opts || typeof opts.media !== 'string') {
      fail(label, `${field.type} alanı "options.media" ile bir medya kaynağı adı belirtmeli (options.source DEĞİL)`);
    } else if (!mediaNames.has(opts.media)) {
      fail(label, `"options.media: ${opts.media}" tanımlı bir medya kaynağına karşılık gelmiyor (${[...mediaNames].join(', ')})`);
    }
  }

  if (field.type === 'reference') {
    const opts = field.options;
    if (!opts || typeof opts.collection !== 'string') {
      fail(label, 'reference alanı "options.collection" ile bir koleksiyon adı belirtmeli');
    } else if (!collectionNames.has(opts.collection)) {
      fail(label, `"options.collection: ${opts.collection}" tanımlı bir "type: collection" girişine karşılık gelmiyor`);
    }
  }

  // Nested field arrays (object/block field types) — recurse defensively.
  if (Array.isArray(field.fields)) {
    for (const nested of field.fields) checkField(`${label} (iç içe)`, nested);
  }
}

function checkOperations(where, operations) {
  if (!operations) return;
  for (const [key, value] of Object.entries(operations)) {
    if (!VALID_OPERATION_KEYS.has(key)) {
      fail(where, `operations.${key} geçerli bir anahtar değil (create/rename/delete olmalı)`);
    }
    if (typeof value !== 'boolean') {
      fail(where, `operations.${key} bir boolean (true/false) olmalı, bulunan: ${JSON.stringify(value)}`);
    }
  }
}

function checkView(where, view, fieldNames) {
  if (!view) return;
  if (view.sort) {
    if (!Array.isArray(view.sort) || view.sort.some((s) => typeof s !== 'string')) {
      fail(where, 'view.sort düz bir alan adı listesi olmalı (örn. [publishAt, title]), {field, direction} nesneleri DEĞİL');
    } else {
      for (const s of view.sort) {
        if (!fieldNames.has(s)) fail(where, `view.sort içindeki "${s}" tanımlı bir alan değil`);
      }
    }
  }
  if (view.default) {
    if (typeof view.default.sort !== 'string') {
      fail(where, 'view.default.sort bir alan adı (string) olmalı (view.default.field DEĞİL)');
    }
    if (view.default.order && !VALID_SORT_ORDER.has(view.default.order)) {
      fail(where, `view.default.order "asc" veya "desc" olmalı, bulunan: ${view.default.order}`);
    }
  }
  if (view.fields) {
    for (const f of view.fields) {
      if (!fieldNames.has(f)) fail(where, `view.fields içindeki "${f}" tanımlı bir alan değil`);
    }
  }
}

for (const entry of config.content ?? []) {
  const where = `content > "${entry.name}"`;
  if (entry.type !== 'collection' && entry.type !== 'file') {
    fail(where, `"type" "collection" veya "file" olmalı, bulunan: ${JSON.stringify(entry.type)}`);
  }
  if (!entry.path) fail(where, '"path" alanı eksik');
  if (!Array.isArray(entry.fields)) {
    fail(where, '"fields" bir dizi olmalı');
    continue;
  }
  const fieldNames = new Set(entry.fields.map((f) => f.name));
  for (const field of entry.fields) checkField(where, field);
  checkOperations(where, entry.operations);
  checkView(where, entry.view, fieldNames);

  // Legacy top-level create/delete keys (pre-`operations`) must not reappear.
  if ('create' in entry || 'delete' in entry) {
    fail(where, 'üst seviye "create"/"delete" anahtarları kullanılmamalı — "operations: { create, rename, delete }" kullanın');
  }
}

if (config.settings?.commit?.templates) {
  for (const key of Object.keys(config.settings.commit.templates)) {
    if (!VALID_COMMIT_KEYS.has(key)) {
      fail('settings.commit.templates', `"${key}" geçerli bir anahtar değil (create/update/delete/rename olmalı)`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\n[validate-pages-cms-config] ${errors.length} sorun bulundu:\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error('');
  process.exit(1);
}
console.log(
  `[validate-pages-cms-config] OK — ${config.content.length} içerik koleksiyonu/dosyası, ${config.media.length} medya kaynağı doğrulandı.`,
);
