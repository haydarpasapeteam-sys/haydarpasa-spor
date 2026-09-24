import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('isSafeExternalUrl', () => {
  it('allows https, http, mailto, and tel', async () => {
    const { isSafeExternalUrl } = await import('../../src/lib/url');
    expect(isSafeExternalUrl('https://forms.gle/abc123')).toBe(true);
    expect(isSafeExternalUrl('http://example.com')).toBe(true);
    expect(isSafeExternalUrl('mailto:haydarpasapeteam@gmail.com')).toBe(true);
    expect(isSafeExternalUrl('tel:+905551234567')).toBe(true);
  });

  it('rejects javascript: and data: schemes', async () => {
    const { isSafeExternalUrl } = await import('../../src/lib/url');
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects unparseable strings', async () => {
    const { isSafeExternalUrl } = await import('../../src/lib/url');
    expect(isSafeExternalUrl('not a url')).toBe(false);
  });
});

describe('withBase', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.stubEnv('BASE_URL', '/haydarpasa-spor/');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    Object.assign(import.meta.env, originalEnv);
  });

  it('joins the configured base with a site-relative path', async () => {
    vi.resetModules();
    const { withBase } = await import('../../src/lib/url');
    expect(withBase('/duyurular/')).toBe('/haydarpasa-spor/duyurular/');
  });

  it('normalizes a missing leading slash on the input path', async () => {
    vi.resetModules();
    const { withBase } = await import('../../src/lib/url');
    expect(withBase('duyurular/')).toBe('/haydarpasa-spor/duyurular/');
  });
});
