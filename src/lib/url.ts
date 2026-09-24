/**
 * Base-path aware URL helpers.
 *
 * Astro exposes the configured `base` (see astro.config.mjs) as
 * `import.meta.env.BASE_URL` at build time. It is "/" in local dev and
 * "/haydarpasa-spor/" on GitHub Pages today, and would become "/" again
 * automatically if a custom domain is configured later — so every internal
 * link and asset reference must go through these helpers instead of a
 * hard-coded "/haydarpasa-spor/" string.
 */

const BASE_URL = import.meta.env.BASE_URL ?? '/';

/** Join the site base with an internal, site-relative path. */
export function withBase(path: string): string {
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/** Build a fully-qualified canonical URL for SEO tags (site + base + path). */
export function canonicalUrl(path: string): string {
  const site = import.meta.env.SITE ?? 'https://haydarpasapeteam-sys.github.io';
  const siteOrigin = site.endsWith('/') ? site.slice(0, -1) : site;
  return `${siteOrigin}${withBase(path)}`;
}

/**
 * Protocol allowlist for user/CMS-supplied external URLs (relatedUrl,
 * applicationUrl, externalUrl, etc). Rejects javascript:, data:, and other
 * unexpected schemes before a link is ever rendered.
 */
const SAFE_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:']);

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}
