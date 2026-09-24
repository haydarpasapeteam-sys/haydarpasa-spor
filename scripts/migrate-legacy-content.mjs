#!/usr/bin/env node
/**
 * Safe, idempotent legacy-content migration.
 *
 * Regenerates markdown files under src/content/** from the curated dataset
 * below (hand-extracted from the flat legacy repository — index.html,
 * poster PNGs, and the PDF/HTML document pairs — before the Astro
 * rebuild; see MIGRATION_REPORT.md for the reasoning behind every date,
 * dedupe decision, and item deliberately left out to avoid fabricating
 * content).
 *
 * Safety model (this script NEVER deletes anything):
 *   1. Every entry is rendered to a staging directory first
 *      (.migration-staging/, gitignored) and structurally validated.
 *   2. If ANY staged entry fails validation, the run aborts with a
 *      nonzero exit code and NOTHING under src/content is touched.
 *   3. Only entries that pass are promoted from staging into
 *      src/content/<collection>/<slug>.md, one file at a time, using a
 *      content-hash manifest (scripts/.migration-manifest.json) to tell
 *      "still exactly what we last generated" apart from "a teacher/editor
 *      has since hand-edited this file":
 *        - target missing              -> create it
 *        - target hash == last-known   -> safe to overwrite (regenerate)
 *        - target hash != last-known   -> SKIP, leave the manual edit alone
 *   4. Unknown files (slugs this script's dataset no longer lists) are
 *      never removed — cleanup, if ever needed, is a separate, deliberate,
 *      human-reviewed step, not something this script does silently.
 *
 * Usage:
 *   node scripts/migrate-legacy-content.mjs           # plan + apply
 *   node scripts/migrate-legacy-content.mjs --dry-run # plan only, no writes
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'src', 'content');
const STAGING_DIR = join(ROOT, '.migration-staging');
const MANIFEST_PATH = join(ROOT, 'scripts', '.migration-manifest.json');
const DRY_RUN = process.argv.includes('--dry-run');

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

function saveManifest(manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/** Minimal, safe YAML scalar serializer for this script's flat, controlled dataset. */
function yamlScalar(value) {
  if (value === undefined) return undefined;
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(String(value)); // double-quoted YAML scalar; handles Turkish text, colons, quotes.
}

function toFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    const scalar = yamlScalar(value);
    if (scalar !== undefined) lines.push(`${key}: ${scalar}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function renderEntry(fields, body = '') {
  return `${toFrontmatter(fields)}\n\n${body.trim()}\n`;
}

// ---------------------------------------------------------------------------
// Lightweight structural validation (mirrors src/content.config.ts rules).
// This is intentionally independent of astro:content — the full Zod
// schemas run again for real during `pnpm run validate` / `astro build`;
// this pass only has to catch mistakes in THIS script's own dataset
// before anything is promoted out of staging.
// ---------------------------------------------------------------------------
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
function validateEntry(collection, slug, fields) {
  const errors = [];
  if (!SLUG_RE.test(slug)) errors.push(`geçersiz slug: "${slug}"`);
  if (fields.slug !== slug) errors.push(`slug alanı (${fields.slug}) dosya adıyla (${slug}) eşleşmiyor`);
  if (fields.coverImage && !fields.coverImageAlt) errors.push('coverImage var ama coverImageAlt yok');
  if (fields.coverImage && !fields.coverImage.startsWith('/media/images/')) {
    errors.push(`coverImage /media/images/ ile başlamıyor: ${fields.coverImage}`);
  }
  if (collection === 'announcements') {
    if (fields.expiresAt && new Date(fields.expiresAt) < new Date(fields.publishAt)) {
      errors.push('expiresAt, publishAt’den önce olamaz');
    }
    if (!['Duyuru', 'Takım Seçmeleri', 'Turnuva', 'Maç Sonucu', 'Belge', 'Etkinlik'].includes(fields.category)) {
      errors.push(`geçersiz category: ${fields.category}`);
    }
    if (!['Taslak', 'Yayınlandı', 'Arşivlendi'].includes(fields.status)) {
      errors.push(`geçersiz status: ${fields.status}`);
    }
  }
  if (collection === 'documents' && !fields.file?.startsWith('/media/documents/')) {
    errors.push(`file /media/documents/ ile başlamıyor: ${fields.file}`);
  }
  if (collection === 'matches') {
    if (fields.homeTeam?.trim().toLowerCase() === fields.awayTeam?.trim().toLowerCase()) {
      errors.push('homeTeam === awayTeam');
    }
    if (fields.status === 'Tamamlandı' && (fields.homeScore == null || fields.awayScore == null)) {
      errors.push('Tamamlandı maçta skor eksik');
    }
  }
  return errors;
}

const staged = []; // { collection, slug, relPath, content }
const report = [];

function stage(collection, slug, fields, body = '') {
  const errors = validateEntry(collection, slug, fields);
  const relPath = join(collection, `${slug}.md`);
  if (errors.length > 0) {
    report.push(`❌ ${relPath}: ${errors.join('; ')}`);
    return { ok: false };
  }
  const content = renderEntry(fields, body);
  staged.push({ collection, slug, relPath, content });
  return { ok: true };
}

// =========================== CURATED DATASET ===============================

// --- Branşlar / Sports ---
const SPORTS = [
  ['basketbol', 'Basketbol', 'top', 'Takım sporları müfredatımızın parçası olan basketbol; okul içi ve okullar arası turnuvalarda temsil edilir.', 1],
  ['voleybol', 'Voleybol', 'top', 'Kız ve erkek okul takımlarımızın mücadele ettiği takım sporu branşı.', 2],
  ['futsal', 'Futsal', 'top', 'Salon içi küçük saha futbolu; okul takımımız 2025-2026 sezonunda Türkiye ikincisi olmuştur.', 3],
  ['futbol', 'Futbol', 'top', 'SporFest ve okullar arası organizasyonlarda erkek ve kız kategorilerinde mücadele edilen açık saha branşı.', 4],
  ['masa-tenisi', 'Masa Tenisi', 'raket', 'Okulumuzun kız masa tenisi takımının da mücadele ettiği raket sporu branşı.', 5],
  ['korfbol', 'Korfbol', 'top', 'Hedef ve koordinasyon becerilerini geliştiren takım sporları müfredatı branşı.', 6],
  ['yakantop', 'Yakantop', 'top', 'Geleneksel okul içi sınıflararası turnuvalarla desteklenen takım sporu branşı.', 7],
  ['badminton', 'Badminton', 'raket', 'Ders içeriği rehberimizde yer alan raket sporları branşlarından biri.', 8],
  ['kort-tenisi', 'Kort Tenisi', 'raket', 'Okulumuzun tenis kortunda uygulanan raket sporu branşı.', 9],
  ['pickleball', 'Pickleball', 'raket', 'Ders içeriği rehberimize yeni eklenen, hızla popülerleşen raket sporu branşı.', 10],
  ['dart', 'Dart', 'hedef', 'Hedef ve koordinasyon sporları kategorisinde işlenen isabet branşı.', 11],
  ['flag-futbol', 'Flag Futbol', 'top', 'Temassız Amerikan futbolu varyantı; ders içeriği rehberimizde ayrı bir görsel rehberi bulunan branş.', 12],
];
for (const [slug, name, icon, description, order] of SPORTS) {
  stage('sports', slug, { name, slug, icon, description, order, active: true });
}
report.push(`Branşlar: ${SPORTS.length} kayıt planlandı (brans_rehberimiz.png ve anasayfa.png afişlerinden).`);

// --- Takımlar / Teams — 2025-2026 OKUL TAKIMLARIMIZ posterinden (takimlarimiz.png) ---
const AGE_GROUP = 'Lise Takımı (9-12. Sınıf)';
const TEAMS = [
  { slug: 'futsal-erkek-takimi', name: 'Futsal Erkek Takımı', sport: 'futsal', season: '2025-2026',
    coachOrTeacher: 'Nurullah Çayırcık',
    summary: 'Okul Sporları Liseler Arası Gençler Futsal Şampiyonası’nda Türkiye ikincisi olan futsal takımımız.',
    body: 'Beden Eğitimi Öğretmenimiz Nurullah Çayırcık liderliğinde katıldığı Okul Sporları Liseler Arası Gençler Futsal Şampiyonası’nda harika bir mücadele sergileyerek ikincilik kupasının sahibi olmuştur.' },
  { slug: 'erkek-voleybol-takimi', name: 'Erkek Voleybol Takımı', sport: 'voleybol', season: '2025-2026',
    summary: 'Üsküdar ilçesi liseler arası voleybol müsabakalarında ilçe üçüncüsü olan erkek voleybol takımımız.',
    body: 'Üsküdar ilçesi liseler arası voleybol müsabakalarında okul voleybol takımımız Üsküdar 3.sü olmuştur.' },
  { slug: 'masa-tenisi-kiz-takimi', name: 'Masa Tenisi Kız Takımı', sport: 'masa-tenisi', season: '2025-2026',
    summary: 'Türkiye Şampiyonası Aksaray Grup maçlarında İstanbul 5.si olan kız masa tenisi takımımız.',
    body: 'İstanbul 5.si olarak okulumuzu Türkiye Şampiyonası Aksaray Grup maçlarında temsil eden kız masa tenisi takımımız, Aksaray bölgesinde 6. olarak bu yılki okul sporları resmi müsabakalarını tamamlamıştır.' },
  { slug: 'erkek-basketbol-takimi', name: 'Erkek Basketbol Takımı', sport: 'basketbol', season: '2025-2026',
    summary: '2025-2026 sezonu okul takımlarımızdan erkek basketbol takımı.',
    body: '2025-2026 eğitim-öğretim yılı okul takımlarımız arasında yer alan erkek basketbol takımımız, okul içi ve okullar arası organizasyonlarda okulumuzu temsil etmektedir.' },
  { slug: 'kiz-voleybol-takimi', name: 'Kız Voleybol Takımı', sport: 'voleybol', season: '2025-2026',
    summary: '2025-2026 sezonu okul takımlarımızdan kız voleybol takımı.',
    body: '2025-2026 eğitim-öğretim yılı okul takımlarımız arasında yer alan kız voleybol takımımız, okul içi ve okullar arası organizasyonlarda okulumuzu temsil etmektedir.' },
];
TEAMS.forEach((t, i) => {
  stage('teams', t.slug, {
    name: t.name, slug: t.slug, sport: t.sport, season: t.season,
    ageOrClassGroup: AGE_GROUP, summary: t.summary, coachOrTeacher: t.coachOrTeacher,
    active: true, order: i + 1,
  }, t.body);
});
report.push(`Takımlar: ${TEAMS.length} kayıt planlandı (takimlarimiz.png ve basarilarimiz.png afişlerinden, 2025-2026 sezonu).`);

// --- Turnuvalar / Tournaments ---
const TOURNAMENTS = [
  { slug: 'futsal-all-star-turnuvasi-2026-2027', title: 'Futsal All-Star Turnuvası', sport: 'futsal', season: '2026-2027',
    status: 'Başvurular Açık',
    summary: 'Sınıflararası futsal turnuvası kayıtları devam ediyor.',
    body: 'HPL Sınıflararası Futsal All-Star Turnuvası için takım kayıtları devam etmektedir. Kayıt ve fikstür bilgileri aşağıdaki bağlantılardan takip edilebilir.',
    applicationUrl: 'https://forms.gle/QxvR7VJhBeYzdGJv9',
    coverImage: '/media/images/turnuvalar/futsal-all-star-turnuvasi.png',
    coverImageAlt: 'Futsal All-Star Turnuvası afişi' },
  { slug: 'all-star-voleybol-turnuvasi-2025-2026', title: 'All-Star Voleybol Turnuvası', sport: 'voleybol', season: '2025-2026',
    status: 'Tamamlandı', startDate: '2026-04-13T12:00:00+03:00',
    summary: 'Geleneksel All-Star Voleybol Turnuvası’nda 11. sınıf öğrencilerimiz şampiyon olmuştur.',
    body: 'Geleneksel All-Star Voleybol Turnuvası’nda sergiledikleri üstün performans, takım ruhu ve azimle şampiyonluğa ulaşan 11. sınıf öğrencilerimizi kutluyoruz.' },
  { slug: 'siniflarasi-yakantop-turnuvasi-2025-2026', title: 'Sınıflararası Yakantop Turnuvası', sport: 'yakantop', season: '2025-2026',
    status: 'Tamamlandı', startDate: '2026-04-14T12:00:00+03:00',
    summary: 'Yeşilay Kulübümüzün düzenlediği Okul İçi Sokak Oyunları Yakantop Turnuvası.',
    body: 'Yeşilay Kulübümüzün düzenlediği Okul İçi Sokak Oyunları Yakantop Turnuvası, 9. sınıf öğrencilerimizin eğlenceli ve heyecan dolu mücadelelerine sahne olmuştur.' },
];
for (const t of TOURNAMENTS) {
  stage('tournaments', t.slug, {
    title: t.title, slug: t.slug, sport: t.sport, season: t.season, status: t.status,
    startDate: t.startDate, endDate: t.startDate, applicationUrl: t.applicationUrl,
    summary: t.summary, coverImage: t.coverImage, coverImageAlt: t.coverImageAlt, published: true,
  }, t.body);
}
report.push(`Turnuvalar: ${TOURNAMENTS.length} kayıt planlandı. NOT: startDate/endDate şeması isteğe bağlı — bkz. MIGRATION_REPORT.md.`);

// --- Duyurular / Announcements ---
const ANNOUNCEMENTS = [
  { slug: 'basketbol-takimi-secmeleri', title: 'Basketbol Okul Takımı Seçmeleri', category: 'Takım Seçmeleri',
    status: 'Yayınlandı', publishAt: '2026-09-21T09:00:00+03:00', expiresAt: '2026-09-26T00:00:00+03:00',
    featured: true, priority: 90,
    summary: 'Hazırlık ve 9. sınıflar için spor salonunda yapılacaktır (25 Eylül Cuma, 12.00).',
    coverImage: '/media/images/duyurular/basketbol-secmeleri.png',
    coverImageAlt: 'Basketbol okul takımı seçmeleri afişi',
    relatedDocument: 'ders-disi-egzersiz-izin-belgesi',
    body: '25 Eylül Cuma günü saat 12.00’de spor salonunda gerçekleştirilecek basketbol okul takımı seçmelerine hazırlık ve 9. sınıf öğrencileri katılabilir.' },
  { slug: 'erkek-voleybol-takimi-secmeleri', title: 'Erkek Voleybol Takımı Seçmeleri', category: 'Takım Seçmeleri',
    status: 'Yayınlandı', publishAt: '2026-09-20T09:00:00+03:00', expiresAt: '2026-09-25T00:00:00+03:00',
    featured: true, priority: 85,
    summary: 'Spor salonunda uygun kıyafetle katılım sağlanmalıdır (24 Eylül Perşembe, 12.00).',
    coverImage: '/media/images/duyurular/erkek-voleybol-secmeleri.png',
    coverImageAlt: 'Erkek voleybol takımı seçmeleri afişi',
    relatedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfav-UBj3jUEG2RiOJELR-N3DpY_oSjpXyClurtsZw6U-PVhA/viewform?usp=header',
    body: '24 Eylül Perşembe günü saat 12.00’de spor salonunda yapılacak erkek voleybol takımı seçmelerine uygun spor kıyafetiyle katılım sağlanmalıdır.\n\nVeli izni formu: https://docs.google.com/forms/d/e/1FAIpQLSc4DfWhC0wkvuSsyG5k1l6HMdy8Nykycv7qy4NYp2p2CXSrWg/viewform?usp=header' },
  { slug: 'kiz-voleybol-takimi-secmeleri', title: 'Kız Voleybol Takımı Seçmeleri', category: 'Takım Seçmeleri',
    status: 'Yayınlandı', publishAt: '2026-09-19T09:00:00+03:00', expiresAt: '2026-10-03T00:00:00+03:00',
    featured: true, priority: 80,
    summary: '“Bir Takım Daha Fazlasıdır” — tüm öğrencileri bekliyoruz (2 Ekim Cuma, 12.00).',
    coverImage: '/media/images/duyurular/kiz-voleybol-secmeleri.png',
    coverImageAlt: 'Kız voleybol takımı seçmeleri afişi',
    relatedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc4DfWhC0wkvuSsyG5k1l6HMdy8Nykycv7qy4NYp2p2CXSrWg/viewform?usp=header',
    body: '2 Ekim Cuma günü saat 12.00’de yapılacak kız voleybol takımı seçmelerine tüm öğrencilerimiz katılabilir.' },
  { slug: 'futsal-all-star-turnuvasi-kayitlari', title: 'Futsal All-Star Turnuvası Kayıtları', category: 'Turnuva',
    status: 'Yayınlandı', publishAt: '2026-09-18T09:00:00+03:00',
    featured: true, priority: 70,
    summary: 'Sınıflararası futsal turnuvası kayıtları devam ediyor.',
    coverImage: '/media/images/turnuvalar/futsal-all-star-turnuvasi.png',
    coverImageAlt: 'Futsal All-Star Turnuvası afişi',
    relatedUrl: 'https://forms.gle/QxvR7VJhBeYzdGJv9',
    relatedTournament: 'futsal-all-star-turnuvasi-2026-2027',
    body: 'HPL Sınıflararası Futsal All-Star Turnuvası için takım kayıtları devam etmektedir.' },
  { slug: 'basarilarimiz-2025-2026', title: 'Başarılarımız: Futsal, Masa Tenisi ve Voleybol', category: 'Maç Sonucu',
    status: 'Yayınlandı', publishAt: '2026-09-21T10:00:00+03:00',
    featured: true, priority: 60,
    summary: 'Futsal takımımız Türkiye ikincisi, masa tenisi takımımız İstanbul 5.si, voleybol takımımız Üsküdar 3.sü oldu.',
    coverImage: '/media/images/kurumsal/basarilarimiz.png',
    coverImageAlt: 'Futsal Türkiye ikinciliği, masa tenisi ve voleybol başarıları afişi',
    body: [
      '**Futsal Takımımız Türkiye İkincisi!** Okul futsal takımımız, Beden Eğitimi Öğretmenimiz Nurullah Çayırcık liderliğinde katıldığı Okul Sporları Liseler Arası Gençler Futsal Şampiyonası’nda harika bir mücadele sergileyerek ikincilik kupasının sahibi oldu. Takımımızı zafere hazırlayan öğretmenimize ve sahada ter döküp göğsümüzü kabartan öğrencilerimize teşekkürlerimizi sunuyoruz.',
      'İstanbul 5.si olarak okulumuzu Türkiye Şampiyonası Aksaray Grup maçlarında temsil eden kız masa tenisi takımımız, Aksaray bölgesinde 6. olarak bu yılki okul sporları resmi müsabakalarını tamamlamıştır.',
      'Üsküdar ilçesi liseler arası voleybol müsabakalarında okul voleybol takımımız Üsküdar 3.sü olmuştur. Öğrencilerimizi tebrik eder, başarılarının devamını dileriz.',
    ].join('\n\n') },
  { slug: 'voleybol-turnuvamiz-basliyor', title: 'Voleybol Turnuvamız Başlıyor', category: 'Turnuva',
    status: 'Arşivlendi', publishAt: '2026-04-13T09:00:00+03:00',
    featured: false, priority: 0,
    summary: '13 Nisan 2026 Pazartesi itibarıyla voleybol turnuvamız başlamıştır. (Arşiv kaydı — turnuva tamamlanmıştır.)',
    body: '13 Nisan 2026 Pazartesi günü voleybol turnuvamız başlamıştır. Bu duyuru, geçmiş bir etkinliğin arşiv kaydı olarak saklanmaktadır; turnuvanın sonucu için Turnuvalar sayfasındaki All-Star Voleybol Turnuvası kaydına bakınız.' },
  { slug: 'yakantop-turnuvamiz-basliyor', title: 'Yakantop Turnuvamız Başlıyor', category: 'Turnuva',
    status: 'Arşivlendi', publishAt: '2026-04-14T09:00:00+03:00',
    featured: false, priority: 0,
    summary: '14 Nisan 2026 Salı itibarıyla yakantop turnuvamız başlamıştır. (Arşiv kaydı — turnuva tamamlanmıştır.)',
    body: '14 Nisan 2026 Salı günü yakantop turnuvamız başlamıştır. Bu duyuru, geçmiş bir etkinliğin arşiv kaydı olarak saklanmaktadır; turnuvanın sonucu için Turnuvalar sayfasındaki Sınıflararası Yakantop Turnuvası kaydına bakınız.' },
];
for (const a of ANNOUNCEMENTS) {
  stage('announcements', a.slug, {
    title: a.title, slug: a.slug, summary: a.summary, category: a.category, status: a.status,
    publishAt: a.publishAt, expiresAt: a.expiresAt, featured: a.featured, priority: a.priority,
    coverImage: a.coverImage, coverImageAlt: a.coverImageAlt, relatedUrl: a.relatedUrl,
    relatedDocument: a.relatedDocument, relatedMatch: a.relatedMatch, relatedTournament: a.relatedTournament,
  }, a.body);
}
report.push(`Duyurular: ${ANNOUNCEMENTS.length} kayıt planlandı (coverImage alanları public/media/images altındaki gerçek afişlere işaret eder).`);

// --- Belgeler / Documents ---
const DOCUMENTS = [
  ['saglik-durumu-beyan-formu', 'Sağlık Durumu Beyan Formu', 'Sağlık Beyanı', 'Beden Eğitimi dersleri ve okul içi spor faaliyetleri için veli sağlık durumu beyan formu.', 1],
  ['turnuva-ve-egzersiz-izin-belgesi', 'Turnuvalar ve Egzersiz Veli İzin Belgesi', 'İzin Belgesi', 'Okul içi turnuvalar ile il/ilçe spor müsabakaları için veli izin belgesi.', 2],
  ['ders-disi-egzersiz-izin-belgesi', 'Ders Dışı Eğitim ve Egzersiz Veli İzin Belgesi', 'İzin Belgesi', 'Hafta içi/sonu antrenman ve egzersiz çalışmaları için veli onay belgesi.', 3],
  ['tesis-havuz-malzeme-taahhutnamesi', 'Tesis, Havuz ve Malzeme Kullanım Taahhütnamesi', 'Taahhütname', 'Salon, havuz ve demirbaş kullanım kuralları taahhüt belgesi.', 4],
  ['spor-salonu-isg-talimati', 'Kapalı Spor Salonu İSG Talimatı', 'İSG Talimatı', 'Kapalı spor salonu kullanımına yönelik iş sağlığı ve güvenliği talimatı.', 5],
  ['yuzme-havuzu-isg-talimati', 'Yüzme Havuzu ve Islak Alanlar İSG Talimatı', 'İSG Talimatı', 'Havuz ve ıslak alan kullanımına yönelik iş sağlığı ve güvenliği talimatı.', 6],
  ['futbol-sahasi-isg-talimati', 'Futbol / Futsal Sahası İSG Talimatı', 'İSG Talimatı', 'Futbol ve futsal sahası kullanımına yönelik iş sağlığı ve güvenliği talimatı.', 7],
  ['tenis-kortu-isg-talimati', 'Tenis Kortu İSG ve Kullanım Talimatı', 'İSG Talimatı', 'Tenis kortu kullanımına yönelik iş sağlığı ve güvenliği talimatı.', 8],
  ['masa-tenisi-salonu-isg-talimati', 'Masa Tenisi Salonu İSG Talimatı', 'İSG Talimatı', 'Masa tenisi salonu kullanımına yönelik iş sağlığı ve güvenliği talimatı.', 9],
];
const VERSION_DATE = '2026-09-21T00:00:00+03:00';
for (const [slug, title, category, summary, order] of DOCUMENTS) {
  stage('documents', slug, {
    title, slug, category, summary,
    file: `/media/documents/${slug}.pdf`,
    printablePage: `/belgeler/${slug}`,
    versionDate: VERSION_DATE, schoolYear: '2026-2027', status: 'Aktif', approved: true, order,
  });
}
report.push(`Belgeler: ${DOCUMENTS.length} kayıt planlandı. ogrenci_taahhutnamesi.pdf (0 bayt) KASITLI OLARAK dahil edilmedi — bkz. pending-documents/.`);

// --- Galeriler / Galleries — SporFest yıl arşivi ---
const GALLERIES = [
  { slug: 'sporfest-2026', title: 'SporFest 2026', year: 2026, event: "HL SporFest '26",
    description: "HL Sporfest '26, Haydarpaşa Lisesi'nin köklü spor geleneğini gençliğin enerjisiyle buluşturan, İstanbul'un seçkin liselerini rekabet ve dostluk çatısı altında bir araya getiren organizasyondur (17-18-19 Haziran 2026). Futboldan voleybola, basketboldan masa tenisine kadar geniş bir yelpazede düzenlenen turnuvalarda centilmenlik, takım ruhu ve yüksek mücadele gücü sahalara yansımıştır.",
    externalUrl: 'https://drive.google.com/drive/folders/1-Jvmvv6LJ6oU6lONosSRNVnRgJPZOyjj',
    coverImage: '/media/images/branding/sporfest-2026-logosu.jpg', coverImageAlt: 'SporFest 2026 logosu', order: 1 },
  { slug: 'sporfest-2025', title: 'SporFest 2025', year: 2025, event: "HL SporFest '25",
    description: "14-15-16 Mayıs 2025 tarihlerinde düzenlenen HL SporFest 2025, Haydarpaşa Lisesi'nin gelenekselleşen köklü spor kültürünü yansıtan festivalde; öğrencilerimiz İSTEK Okulları, Kadıköy Anadolu Lisesi, İstanbul Atatürk Fen Lisesi ve diğer misafir okullarla centilmenlik çerçevesinde mücadele etmiştir.",
    externalUrl: 'https://linktr.ee/Haydarpasasporfest_25',
    coverImage: '/media/images/branding/sporfest-2025-ve-oncesi-logosu.jpg', coverImageAlt: 'SporFest 2025 logosu', order: 2 },
  { slug: 'sporfest-2024', title: 'SporFest 2024', year: 2024, event: "HL SporFest '24",
    description: "15-16-17 Mayıs 2024 tarihli “Sınırları Aşan Enerji” temalı SporFest 2024’te öğrenci ekibimizin kusursuz saha yönetimi, dijital vizyonu ve organizasyonel ustalığı sayesinde festival kültürümüz bir üst düzeye taşınmıştır.",
    externalUrl: 'https://linktr.ee/sporfest2024', order: 3 },
  { slug: 'sporfest-2023', title: 'SporFest 2023', year: 2023, event: "HL SporFest '23",
    description: "8-9-10 Haziran 2023 tarihli “Kurumsallaşan Vizyon ve Artan Yetkinlik” temalı SporFest 2023, festivalin hem kapsam hem organizasyon kalitesi açısından yeni bir boyuta ulaştığı; öğrencilerin liderlik ve kriz yönetimi becerilerini en üst seviyede sergilediği bir organizasyon olmuştur.",
    externalUrl: 'https://linktr.ee/haydarpasasf2023', order: 4 },
  { slug: 'sporfest-2022', title: 'SporFest 2022', year: 2022, event: "HL SporFest '22",
    description: "12-13-14 Mayıs 2022 tarihli “Yeniden Sahada, Yeniden Birlikte” temalı SporFest 2022, pandemi sonrası sosyal canlandırma hedefiyle sporun birleştirici gücünü yeniden sahalara ve öğrencilerimize taşımıştır.",
    externalUrl: 'https://linktr.ee/hlsporfest', order: 5 },
  { slug: 'sporfest-2018', title: 'SporFest 2018', year: 2018, event: "HL SporFest '18",
    description: "4-5-6 Haziran 2018 tarihinde düzenlenen ilk SporFest organizasyonu, Haydarpaşa Lisesi'nin köklü spor kültürünü liseler arası dayanışma ruhuyla sahaya taşıyan ilk tohumları atmış ve okulumuzun büyük organizasyonel vizyonuna hayat vermiştir.",
    externalUrl: 'https://drive.google.com/drive/folders/1_jQU71bsRt7Bct_fREmbUtUj5IDkVXZ5', order: 6 },
];
for (const g of GALLERIES) {
  stage('galleries', g.slug, {
    title: g.title, slug: g.slug, year: g.year, event: g.event, description: g.description,
    externalUrl: g.externalUrl, coverImage: g.coverImage, coverImageAlt: g.coverImageAlt,
    order: g.order, published: true,
  });
}
report.push(`Galeriler: ${GALLERIES.length} kayıt planlandı (sporfest.png yıl arşivi ve index.html Drive/Linktree bağlantılarından).`);

// =========================== VALIDATE, THEN PROMOTE =========================

const failed = report.filter((l) => l.startsWith('❌'));
console.log('\n[migrate-legacy-content] Plan:\n');
report.forEach((l) => console.log(`  ${l.startsWith('❌') ? l : '- ' + l}`));

if (failed.length > 0) {
  console.error(`\n[migrate-legacy-content] ${failed.length} kayıt doğrulamadan geçemedi. Hiçbir dosya yazılmadı.\n`);
  process.exit(1);
}

// Stage to disk (always, even in --dry-run, so the plan is inspectable on disk too).
rmSync(STAGING_DIR, { recursive: true, force: true });
for (const entry of staged) {
  const dest = join(STAGING_DIR, entry.relPath);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, entry.content, 'utf8');
}
console.log(`\n[migrate-legacy-content] ${staged.length} kayıt .migration-staging/ altında hazırlandı ve doğrulandı.`);

if (DRY_RUN) {
  console.log('[migrate-legacy-content] --dry-run: src/content altına hiçbir şey yazılmadı.\n');
  process.exit(0);
}

const manifest = loadManifest();
let created = 0;
let updated = 0;
let skippedManual = 0;

for (const entry of staged) {
  const targetPath = join(CONTENT_DIR, entry.relPath);
  const manifestKey = entry.relPath;
  const newHash = sha256(entry.content);

  if (!existsSync(targetPath)) {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, entry.content, 'utf8');
    manifest[manifestKey] = newHash;
    created++;
    continue;
  }

  const currentContent = readFileSync(targetPath, 'utf8');
  const currentHash = sha256(currentContent);
  const lastKnownHash = manifest[manifestKey];

  if (lastKnownHash && currentHash === lastKnownHash) {
    if (currentHash !== newHash) {
      writeFileSync(targetPath, entry.content, 'utf8');
      manifest[manifestKey] = newHash;
      updated++;
    }
    continue;
  }

  // File exists but either has no manifest record or has been hand-edited
  // since the last generation — never overwrite an editor's manual work.
  skippedManual++;
  console.log(`  (elle düzenlenmiş, atlandı) ${entry.relPath}`);
}

saveManifest(manifest);
rmSync(STAGING_DIR, { recursive: true, force: true });

console.log(
  `\n[migrate-legacy-content] tamam: ${created} oluşturuldu, ${updated} güncellendi, ${skippedManual} elle-düzenlenmiş dosya korunarak atlandı.`,
);
console.log('Bu betik idempotenttir ve YIKICI DEĞİLDİR: bilinmeyen/elle eklenmiş dosyaları asla silmez.\n');
