import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
export const BASE_PATH = '/haydarpasa-spor';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  // No `webServer` block: verified empirically that Astro 7's `astro
  // preview` cannot be auto-spawned by Playwright's webServer feature —
  // it detaches from the process Playwright launches, which Playwright
  // then reports as "Process from config.webServer exited early" even
  // though the server itself keeps running. `astro preview` is the only
  // server that understands this project's `base: '/haydarpasa-spor/'`
  // path (a generic static file server does not), so instead of fighting
  // that, the server is started as an explicit prior step, both locally
  // (`pnpm run build && pnpm run preview`, see README's Testing section)
  // and in CI (see the "Start preview server" step in
  // .github/workflows/validate.yml) — Playwright just talks to whatever
  // is already listening on `baseURL` when the suite runs.
  projects: [
    { name: 'mobile-320', use: { viewport: { width: 320, height: 568 } } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
