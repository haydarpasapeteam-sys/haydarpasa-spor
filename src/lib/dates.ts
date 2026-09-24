/**
 * Europe/Istanbul is the single editorial timezone for all content dates.
 * Turkey has used a fixed UTC+03:00 offset with no DST since 2016, so a
 * constant offset is correct year-round (unlike most European timezones).
 *
 * Editors (via Pages CMS) may enter either a full ISO datetime with an
 * explicit offset ("2026-09-24T12:00:00+03:00" / "...Z") or a bare
 * date/datetime without one ("2026-09-24", "2026-09-24T12:00:00"). Because
 * the Astro build can run on a CI runner in any server timezone (GitHub
 * Actions runners are UTC), a string without an explicit offset must be
 * anchored to Istanbul time explicitly — trusting `new Date(raw)` alone
 * would silently treat it as UTC and shift every boundary by 3 hours.
 */

const HAS_EXPLICIT_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

export function parseIstanbulDate(raw: string | Date): Date {
  if (raw instanceof Date) return raw;
  const trimmed = raw.trim();
  if (HAS_EXPLICIT_OFFSET.test(trimmed)) {
    return new Date(trimmed);
  }
  // Bare date ("2026-09-24") or bare datetime ("2026-09-24T12:00:00").
  const withTime = trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00`;
  return new Date(`${withTime}+03:00`);
}

export interface AnnouncementVisibility {
  status: 'Taslak' | 'Yayınlandı' | 'Arşivlendi';
  publishAt: Date;
  expiresAt?: Date | null;
}

/** Rules from spec §7: draft never public, future never early, expired never active. */
export function isAnnouncementActive(entry: AnnouncementVisibility, now: Date = new Date()): boolean {
  if (entry.status !== 'Yayınlandı') return false;
  if (now < entry.publishAt) return false;
  if (entry.expiresAt && now >= entry.expiresAt) return false;
  return true;
}

/** Archive view: any announcement that has genuinely been published at least once, and is not a draft. */
export function isAnnouncementVisibleInArchive(entry: AnnouncementVisibility, now: Date = new Date()): boolean {
  if (entry.status === 'Taslak') return false;
  return now >= entry.publishAt;
}

export function isAnnouncementExpired(entry: AnnouncementVisibility, now: Date = new Date()): boolean {
  return Boolean(entry.expiresAt) && now >= (entry.expiresAt as Date);
}

export interface FeaturedSortable {
  featured: boolean;
  priority: number;
  publishAt: Date;
}

/** Featured-first, then by explicit priority (desc), then most recent first. */
export function sortAnnouncements<T extends FeaturedSortable>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.publishAt.getTime() - a.publishAt.getTime();
  });
}
