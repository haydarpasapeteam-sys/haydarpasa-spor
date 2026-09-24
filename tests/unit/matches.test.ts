import { describe, it, expect } from 'vitest';
import { computeMatchWinner, isNonNegativeInteger, validateMatch } from '../../src/lib/matches';

describe('computeMatchWinner', () => {
  it('returns null for anything not Tamamlandı', () => {
    expect(computeMatchWinner({ status: 'Planlandı', homeScore: 3, awayScore: 1 })).toBeNull();
    expect(computeMatchWinner({ status: 'Canlı', homeScore: 3, awayScore: 1 })).toBeNull();
  });

  it('returns null when scores are missing even if Tamamlandı', () => {
    expect(computeMatchWinner({ status: 'Tamamlandı' })).toBeNull();
    expect(computeMatchWinner({ status: 'Tamamlandı', homeScore: 2 })).toBeNull();
  });

  it('picks the higher score as winner', () => {
    expect(computeMatchWinner({ status: 'Tamamlandı', homeScore: 3, awayScore: 1 })).toBe('home');
    expect(computeMatchWinner({ status: 'Tamamlandı', homeScore: 1, awayScore: 3 })).toBe('away');
  });

  it('reports a draw on equal scores', () => {
    expect(computeMatchWinner({ status: 'Tamamlandı', homeScore: 2, awayScore: 2 })).toBe('draw');
  });
});

describe('isNonNegativeInteger', () => {
  it('accepts zero and positive integers', () => {
    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(7)).toBe(true);
  });
  it('rejects negatives, floats, and non-numbers', () => {
    expect(isNonNegativeInteger(-1)).toBe(false);
    expect(isNonNegativeInteger(1.5)).toBe(false);
    expect(isNonNegativeInteger('3')).toBe(false);
    expect(isNonNegativeInteger(undefined)).toBe(false);
  });
});

describe('validateMatch', () => {
  const base = { homeTeam: 'Haydarpaşa Lisesi', awayTeam: 'Kadıköy Anadolu Lisesi', status: 'Planlandı' };

  it('passes for a well-formed scheduled match with no scores', () => {
    expect(validateMatch(base)).toEqual({ valid: true, errors: [] });
  });

  it('rejects a team playing itself (case/whitespace-insensitive)', () => {
    const result = validateMatch({ ...base, awayTeam: '  haydarpaşa lisesi  ' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/kendisiyle eşleşemez/);
  });

  it('rejects a negative score', () => {
    const result = validateMatch({ ...base, homeScore: -1 });
    expect(result.valid).toBe(false);
  });

  it('rejects a non-integer score', () => {
    const result = validateMatch({ ...base, awayScore: 2.5 });
    expect(result.valid).toBe(false);
  });

  it('requires both scores when status is Tamamlandı', () => {
    const result = validateMatch({ ...base, status: 'Tamamlandı', homeScore: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('skor eksik') || e.includes('homeScore'))).toBe(true);
  });

  it('accepts a completed match with both non-negative integer scores', () => {
    const result = validateMatch({ ...base, status: 'Tamamlandı', homeScore: 4, awayScore: 0 });
    expect(result).toEqual({ valid: true, errors: [] });
  });
});
