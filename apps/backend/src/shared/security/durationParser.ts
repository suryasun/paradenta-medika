const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses simple duration strings ("15m", "30d", "7d") into milliseconds.
 * Used to compute database expiry timestamps from the same
 * JWT_ACCESS_EXPIRY/JWT_REFRESH_EXPIRY environment values the JWT library
 * consumes, so both stay in sync without duplicating the value.
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit];
}
