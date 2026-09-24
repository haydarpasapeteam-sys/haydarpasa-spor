/**
 * Match score/winner helpers. The winner is always derived from
 * homeScore/awayScore — spec §7 explicitly forbids storing a duplicated
 * "winner" field that could drift out of sync with the scores.
 */

export type MatchWinner = 'home' | 'away' | 'draw' | null;

export interface MatchScoreInput {
  status: 'Planlandı' | 'Canlı' | 'Tamamlandı' | 'Ertelendi' | 'İptal Edildi';
  homeScore?: number | null;
  awayScore?: number | null;
}

export function computeMatchWinner(match: MatchScoreInput): MatchWinner {
  if (match.status !== 'Tamamlandı') return null;
  if (match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore > match.awayScore) return 'home';
  if (match.awayScore > match.homeScore) return 'away';
  return 'draw';
}

export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export interface MatchValidationInput {
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

export interface MatchValidationResult {
  valid: boolean;
  errors: string[];
}

/** Mirrors the rules a Zod .superRefine() enforces in content.config.ts, exposed standalone for unit tests and validation scripts. */
export function validateMatch(input: MatchValidationInput): MatchValidationResult {
  const errors: string[] = [];

  if (input.homeTeam.trim().toLowerCase() === input.awayTeam.trim().toLowerCase()) {
    errors.push('Bir takım kendisiyle eşleşemez (homeTeam === awayTeam).');
  }

  const hasHomeScore = input.homeScore !== undefined && input.homeScore !== null;
  const hasAwayScore = input.awayScore !== undefined && input.awayScore !== null;

  if (hasHomeScore && !isNonNegativeInteger(input.homeScore)) {
    errors.push('homeScore negatif olmayan bir tam sayı olmalıdır.');
  }
  if (hasAwayScore && !isNonNegativeInteger(input.awayScore)) {
    errors.push('awayScore negatif olmayan bir tam sayı olmalıdır.');
  }

  if (input.status === 'Tamamlandı' && (!hasHomeScore || !hasAwayScore)) {
    errors.push('Tamamlandı durumundaki bir maçın hem homeScore hem awayScore değeri olmalıdır.');
  }

  return { valid: errors.length === 0, errors };
}
