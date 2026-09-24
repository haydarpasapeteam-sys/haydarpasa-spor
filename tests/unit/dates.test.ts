import { describe, it, expect } from 'vitest';
import { parseIstanbulDate, isAnnouncementActive, isAnnouncementVisibleInArchive, isAnnouncementExpired, sortAnnouncements } from '../../src/lib/dates';

describe('parseIstanbulDate', () => {
  it('anchors a bare date to Europe/Istanbul midnight (+03:00), not UTC', () => {
    const d = parseIstanbulDate('2026-09-24');
    expect(d.toISOString()).toBe('2026-09-23T21:00:00.000Z');
  });

  it('anchors a bare datetime to +03:00', () => {
    const d = parseIstanbulDate('2026-09-24T12:00:00');
    expect(d.toISOString()).toBe('2026-09-24T09:00:00.000Z');
  });

  it('trusts an explicit offset as-is', () => {
    const d = parseIstanbulDate('2026-09-24T12:00:00+03:00');
    expect(d.toISOString()).toBe('2026-09-24T09:00:00.000Z');
  });

  it('trusts an explicit Z (UTC) suffix as-is', () => {
    const d = parseIstanbulDate('2026-09-24T09:00:00Z');
    expect(d.toISOString()).toBe('2026-09-24T09:00:00.000Z');
  });

  it('passes a Date instance through unchanged', () => {
    const original = new Date('2026-01-01T00:00:00Z');
    expect(parseIstanbulDate(original)).toBe(original);
  });
});

describe('isAnnouncementActive', () => {
  const now = new Date('2026-09-23T12:00:00Z');

  it('rejects drafts even if published dates would otherwise qualify', () => {
    expect(
      isAnnouncementActive({ status: 'Taslak', publishAt: new Date('2026-01-01') }, now),
    ).toBe(false);
  });

  it('rejects archived entries', () => {
    expect(
      isAnnouncementActive({ status: 'Arşivlendi', publishAt: new Date('2026-01-01') }, now),
    ).toBe(false);
  });

  it('rejects a published entry whose publishAt is still in the future', () => {
    expect(
      isAnnouncementActive({ status: 'Yayınlandı', publishAt: new Date('2026-12-25') }, now),
    ).toBe(false);
  });

  it('rejects an expired published entry (now >= expiresAt)', () => {
    expect(
      isAnnouncementActive(
        { status: 'Yayınlandı', publishAt: new Date('2026-01-01'), expiresAt: new Date('2026-06-01') },
        now,
      ),
    ).toBe(false);
  });

  it('accepts a published, already-started, not-yet-expired entry', () => {
    expect(
      isAnnouncementActive(
        { status: 'Yayınlandı', publishAt: new Date('2026-01-01'), expiresAt: new Date('2026-12-01') },
        now,
      ),
    ).toBe(true);
  });

  it('accepts a published entry with no expiresAt at all', () => {
    expect(isAnnouncementActive({ status: 'Yayınlandı', publishAt: new Date('2026-01-01') }, now)).toBe(true);
  });
});

describe('isAnnouncementVisibleInArchive', () => {
  const now = new Date('2026-09-23T12:00:00Z');

  it('excludes drafts from the archive too', () => {
    expect(isAnnouncementVisibleInArchive({ status: 'Taslak', publishAt: new Date('2020-01-01') }, now)).toBe(false);
  });

  it('excludes future-dated entries from the archive', () => {
    expect(isAnnouncementVisibleInArchive({ status: 'Yayınlandı', publishAt: new Date('2030-01-01') }, now)).toBe(false);
  });

  it('includes expired/archived entries that were already published', () => {
    expect(
      isAnnouncementVisibleInArchive(
        { status: 'Arşivlendi', publishAt: new Date('2026-04-13'), expiresAt: undefined },
        now,
      ),
    ).toBe(true);
  });
});

describe('isAnnouncementExpired', () => {
  it('is false without an expiresAt', () => {
    expect(isAnnouncementExpired({ status: 'Yayınlandı', publishAt: new Date('2020-01-01') })).toBe(false);
  });

  it('is true once now has reached expiresAt', () => {
    const now = new Date('2026-01-02');
    expect(
      isAnnouncementExpired(
        { status: 'Yayınlandı', publishAt: new Date('2026-01-01'), expiresAt: new Date('2026-01-02') },
        now,
      ),
    ).toBe(true);
  });
});

describe('sortAnnouncements', () => {
  it('puts featured entries before non-featured regardless of date', () => {
    const a = { featured: false, priority: 0, publishAt: new Date('2026-09-01') };
    const b = { featured: true, priority: 0, publishAt: new Date('2020-01-01') };
    expect(sortAnnouncements([a, b])).toEqual([b, a]);
  });

  it('breaks ties within the same featured tier by priority (desc)', () => {
    const a = { featured: true, priority: 10, publishAt: new Date('2026-01-01') };
    const b = { featured: true, priority: 90, publishAt: new Date('2020-01-01') };
    expect(sortAnnouncements([a, b])).toEqual([b, a]);
  });

  it('falls back to most-recent publishAt first', () => {
    const older = { featured: false, priority: 0, publishAt: new Date('2020-01-01') };
    const newer = { featured: false, priority: 0, publishAt: new Date('2026-01-01') };
    expect(sortAnnouncements([older, newer])).toEqual([newer, older]);
  });
});
