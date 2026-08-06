import { Visit } from '@prisma/client';
import { VisitNotOpenException } from '../../domain/exceptions/EmrExceptions';

// docs/06-tasks/task-316.md: COMPLETED no longer blocks clinical
// documentation writes -- staff must be able to correct a SOAP Note/Vital
// Sign/etc. entry error after a visit is marked complete. Only LOCKED
// (Administrator-authorized unlock required) and ARCHIVED remain hard-
// locked. Treatment specifically gets its own, stricter, payment-driven
// gate on top of this relaxed one -- see assertTreatmentEditable.ts
// (docs/06-tasks/task-317.md).
const CLOSED_STATUSES = ['LOCKED', 'ARCHIVED'];

/**
 * docs/06-tasks/task-049.md/task-050.md/task-051.md: clinical documentation
 * can only be recorded against an open (non-Locked/Archived) Visit.
 */
export function assertVisitOpen(visit: Visit): void {
  if (CLOSED_STATUSES.includes(visit.status)) {
    throw new VisitNotOpenException();
  }
}
