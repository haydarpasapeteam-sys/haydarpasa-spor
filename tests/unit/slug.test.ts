import { describe, it, expect } from 'vitest';
import { isValidSlug, slugify } from '../../src/lib/slug';

describe('isValidSlug', () => {
  it('accepts lowercase ascii kebab-case', () => {
    expect(isValidSlug('basketbol-takimi-secmeleri')).toBe(true);
    expect(isValidSlug('sporfest-2026')).toBe(true);
    expect(isValidSlug('a')).toBe(true);
  });

  it('rejects uppercase letters', () => {
    expect(isValidSlug('Basketbol-Secmeleri')).toBe(false);
  });

  it('rejects Turkish diacritics', () => {
    expect(isValidSlug('kız-voleybol-takımı')).toBe(false);
  });

  it('rejects spaces and underscores', () => {
    expect(isValidSlug('erkek voleybol')).toBe(false);
    expect(isValidSlug('erkek_voleybol')).toBe(false);
  });

  it('rejects leading/trailing/double hyphens', () => {
    expect(isValidSlug('-erkek')).toBe(false);
    expect(isValidSlug('erkek-')).toBe(false);
    expect(isValidSlug('erkek--voleybol')).toBe(false);
  });
});

describe('slugify', () => {
  it('transliterates Turkish characters to ASCII', () => {
    expect(slugify('Kız Voleybol Takımı Seçmeleri')).toBe('kiz-voleybol-takimi-secmeleri');
  });

  it('collapses punctuation and whitespace into single hyphens', () => {
    expect(slugify('SporFest  \'26 -- Arşiv!')).toBe('sporfest-26-arsiv');
  });

  it('produces a slug that is itself valid', () => {
    const result = slugify('Öğrenci Taahhütnamesi (2026-2027)');
    expect(isValidSlug(result)).toBe(true);
  });
});
