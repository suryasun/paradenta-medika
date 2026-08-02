/**
 * Prisma `@db.Time()` columns are represented as a DateTime with a fixed
 * epoch date part; this builds that representation from an "HH:mm" string.
 */
export function parseTimeToDate(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}
