import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BASE_PATH } from '../../playwright.config';

const P = (path: string) => `${BASE_PATH}${path}`;

// Accessibility results don't meaningfully vary by viewport size, so this
// suite runs once (desktop project) instead of duplicating across all six
// responsive projects — see playwright.config.ts.
test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'runs once on desktop-1280 only');
});

const PRIMARY_ROUTES = [
  '/',
  '/duyurular/',
  '/maclar/',
  '/takimlar/',
  '/turnuvalar/',
  '/egitim-ve-rehber/',
  '/kurumsal/',
  '/sporfest/',
  '/belgeler/',
  '/iletisim/',
  '/belgeler/saglik-durumu-beyan-formu/',
];

for (const route of PRIMARY_ROUTES) {
  test(`no critical or serious a11y violations on ${route}`, async ({ page }) => {
    await page.goto(P(route));
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Third-party embeds (Canva live boards, Google Maps) are not this
      // site's own markup and cannot be remediated from here — scan our
      // page, not vendors' iframe internals.
      .exclude('iframe')
      .analyze();
    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    if (blocking.length > 0) {
      console.log(JSON.stringify(blocking, null, 2));
    }
    expect(blocking).toEqual([]);
  });
}

test('skip-to-content link is keyboard reachable and focusable first', async ({ page }) => {
  await page.goto(P('/'));
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.className);
  expect(focused).toContain('skip-link');
});

test('icon-only controls have an accessible name', async ({ page }) => {
  await page.goto(P('/belgeler/saglik-durumu-beyan-formu/'));
  const printButton = page.getByRole('button', { name: /yazdır/i });
  await expect(printButton).toBeVisible();
});

test('navigation is usable at 200% zoom without losing reachability', async ({ page }) => {
  await page.goto(P('/'));
  await page.setViewportSize({ width: 640, height: 480 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const homeLink = page.locator('nav[aria-label="Ana gezinme"] a[href="/haydarpasa-spor/"]');
  await expect(homeLink).toBeVisible();
});
