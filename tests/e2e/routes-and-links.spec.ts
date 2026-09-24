import { test, expect } from '@playwright/test';
import { BASE_PATH } from '../../playwright.config';

const P = (path: string) => `${BASE_PATH}${path}`;

// Route/status and broken-link coverage doesn't vary by viewport, so this
// suite also runs once (desktop project only) — see accessibility.spec.ts.
test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'runs once on desktop-1280 only');
});

const ALL_ROUTES = [
  '/',
  '/duyurular/',
  '/duyurular/basketbol-takimi-secmeleri/',
  '/maclar/',
  '/takimlar/',
  '/takimlar/futsal-erkek-takimi/',
  '/turnuvalar/',
  '/egitim-ve-rehber/',
  '/kurumsal/',
  '/sporfest/',
  '/belgeler/',
  '/belgeler/saglik-durumu-beyan-formu/',
  '/belgeler/turnuva-ve-egzersiz-izin-belgesi/',
  '/belgeler/ders-disi-egzersiz-izin-belgesi/',
  '/belgeler/tesis-havuz-malzeme-taahhutnamesi/',
  '/belgeler/spor-salonu-isg-talimati/',
  '/belgeler/yuzme-havuzu-isg-talimati/',
  '/belgeler/futbol-sahasi-isg-talimati/',
  '/belgeler/tenis-kortu-isg-talimati/',
  '/belgeler/masa-tenisi-salonu-isg-talimati/',
  '/iletisim/',
  '/yonetim/',
];

for (const route of ALL_ROUTES) {
  test(`route returns 200: ${route}`, async ({ page }) => {
    const response = await page.goto(P(route));
    expect(response?.status()).toBe(200);
  });
}

test('a nonexistent route serves the custom 404 page', async ({ page }) => {
  const response = await page.goto(P('/bu-sayfa-hic-var-olmadi/'));
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /404/i })).toBeVisible();
});

test('/yonetim/ is marked noindex and contains no secrets', async ({ page }) => {
  await page.goto(P('/yonetim/'));
  const robotsContent = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robotsContent).toContain('noindex');
  const body = await page.content();
  // Check for the SHAPE of a real secret (GitHub PAT/App tokens, JWTs,
  // "Bearer ..." headers) rather than banning the bare English word
  // "token" — this page's own copy legitimately explains, in Turkish,
  // that it never contains a "jeton (token)", which would otherwise be a
  // false positive.
  expect(body).not.toMatch(/gh[ps]_[A-Za-z0-9]{20,}/); // GitHub PAT
  expect(body).not.toMatch(/github_pat_[A-Za-z0-9_]{20,}/); // fine-grained GitHub PAT
  expect(body).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/); // JWT-shaped
  expect(body).not.toMatch(/bearer\s+[A-Za-z0-9._-]{15,}/i);
  expect(body.toLowerCase()).not.toContain('password');
});

test('every downloadable document PDF link resolves with a 200 response', async ({ page, request }) => {
  await page.goto(P('/belgeler/'));
  const hrefs = await page.locator('a[href$=".pdf"]').evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await request.get(`http://localhost:4321${href}`);
    expect(res.status(), `expected 200 for ${href}`).toBe(200);
  }
});

test('the missing student undertaking PDF is never linked anywhere on the public site', async ({ page }) => {
  await page.goto(P('/belgeler/'));
  const html = await page.content();
  expect(html).not.toMatch(/href="[^"]*ogrenci[-_]?taahhutnamesi[^"]*\.pdf"/i);
  // The page must still transparently mention it is pending, without linking a file.
  expect(html).toMatch(/dosya bekleniyor|taahhütnamesi/i);
});
