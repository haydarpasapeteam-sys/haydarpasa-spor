/**
 * Slugs are used directly as URL path segments, so they must be safe,
 * predictable ASCII kebab-case — no Turkish diacritics, spaces, or
 * uppercase letters that could cause case-sensitivity or NFC/NFD
 * normalization issues across GitHub, macOS, and Linux CI runners.
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Best-effort Turkish-aware slugify, used by the migration script only (content authors type slugs directly in Pages CMS). */
export function slugify(input: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };
  const replaced = input.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => trMap[ch] ?? ch);
  return replaced
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
