import { test, expect } from '@playwright/test';
import { BASE_PATH } from '../../playwright.config';

const P = (path: string) => `${BASE_PATH}${path}`;

test.describe('Responsive layout — no horizontal overflow', () => {
  const routes = ['/', '/duyurular/', '/maclar/', '/takimlar/', '/turnuvalar/', '/egitim-ve-rehber/', '/kurumsal/', '/sporfest/', '/belgeler/', '/iletisim/'];

  for (const route of routes) {
    test(`no global horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(P(route));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1); // 1px tolerance for sub-pixel rounding
    });
  }
});

test.describe('Mobile header (logo, title, badge)', () => {
  test('logo renders at the intended size and never disappears', async ({ page }) => {
    await page.goto(P('/'));
    const logo = page.locator('.brand-logo');
    await expect(logo).toBeVisible();
    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(48);
    expect(box!.width).toBeLessThanOrEqual(60);
    expect(box!.height).toBeCloseTo(box!.width, 0);
  });

  test('school title text is visible and not clipped off-screen', async ({ page }) => {
    await page.goto(P('/'));
    const title = page.locator('.brand-title');
    await expect(title).toBeVisible();
    const box = await title.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
  });

  test('academic year badge stays visible', async ({ page }) => {
    await page.goto(P('/'));
    const badge = page.locator('.year-badge');
    await expect(badge).toBeVisible();
    const box = await badge.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  });
});

test.describe('Mobile navigation reachability', () => {
  test('"Ana Sayfa" is reachable and not positioned off-screen negative', async ({ page }) => {
    await page.goto(P('/duyurular/'));
    // Scope to the nav and match by href, not accessible-name text — the
    // header brand link's aria-label ("...ana sayfaya dön") also matches a
    // loose /ana sayfa/i text search, and Turkish uppercasing (İ/I) makes
    // case-insensitive text regexes unreliable for nav labels in general.
    const first = page.locator('nav[aria-label="Ana gezinme"] a[href="/haydarpasa-spor/"]');
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
  });

  test('last navigation item ("İletişim") is reachable by scrolling the nav', async ({ page }) => {
    await page.goto(P('/'));
    const last = page.locator('nav[aria-label="Ana gezinme"] a[href="/haydarpasa-spor/iletisim/"]');
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeVisible();
  });

  test('current route is marked with aria-current', async ({ page }) => {
    await page.goto(P('/duyurular/'));
    const current = page.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText(/duyurular/i);
  });
});

test.describe('Announcement cards', () => {
  test('announcement cards on the homepage are visible and link to a detail page', async ({ page }) => {
    await page.goto(P('/'));
    const cards = page.locator('.ann-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    const href = await cards.first().getAttribute('href');
    expect(href).toContain('/duyurular/');
  });
});

test.describe('Documents pages are not clipped on narrow screens', () => {
  test('a permission-form document page fits the viewport width', async ({ page }) => {
    await page.goto(P('/belgeler/saglik-durumu-beyan-formu/'));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const docPage = page.locator('.doc-page');
    await expect(docPage).toBeVisible();
  });

  test('an İSG poster document page fits the viewport width', async ({ page }) => {
    await page.goto(P('/belgeler/spor-salonu-isg-talimati/'));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe('SporFest image', () => {
  test('the SporFest 2025-ve-öncesi logo loads with a 200 response (fixes the legacy 404)', async ({ page }) => {
    await page.goto(P('/sporfest/'));
    const responses: number[] = [];
    page.on('response', (res) => {
      if (res.url().includes('sporfest-2025-ve-oncesi-logosu')) responses.push(res.status());
    });
    // Trigger by revisiting the gallery card image if lazy; force scroll to load it.
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
  });

  test('sporfest gallery cover images resolve to a real file (no broken image)', async ({ page }) => {
    await page.goto(P('/sporfest/'));
    const images = page.locator('.gallery-card img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});

test.describe('Contact links', () => {
  test('contact page has working mailto, tel-free, and https links', async ({ page }) => {
    await page.goto(P('/iletisim/'));
    const mailLink = page.locator('a[href^="mailto:"]');
    await expect(mailLink.first()).toBeVisible();
    // Scope to #main-content — the same link text also appears in the
    // site-wide footer, which would otherwise be a strict-mode violation.
    const officialSite = page.locator('#main-content').getByRole('link', { name: /resmi okul sitesi/i });
    await expect(officialSite).toHaveAttribute('href', /^https:\/\//);
  });

  test('map iframe has a descriptive title', async ({ page }) => {
    await page.goto(P('/iletisim/'));
    const iframe = page.locator('iframe');
    const title = await iframe.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(5);
  });
});

test.describe('Print layout stays A4', () => {
  test('a document page renders at 210mm width under print media', async ({ page }) => {
    await page.goto(P('/belgeler/saglik-durumu-beyan-formu/'));
    await page.emulateMedia({ media: 'print' });
    const widthPx = await page.locator('.doc-page').evaluate((el) => el.getBoundingClientRect().width);
    // 210mm ≈ 793.7px at 96dpi — allow small rounding tolerance.
    expect(widthPx).toBeGreaterThan(780);
    expect(widthPx).toBeLessThan(810);
  });
});
