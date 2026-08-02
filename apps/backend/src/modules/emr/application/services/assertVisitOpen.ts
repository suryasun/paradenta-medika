import { Visit } from '@prisma/client';
import { VisitNotOpenException } from '../../domain/exceptions/EmrExceptions';

const CLOSED_STATUSES = ['COMPLETED', 'LOCKED', 'ARCHIVED'];

/**
 * docs/06-tasks/task-049.md/task-050.md/task-051.md: clinical documentation
 * can only be recorded against an open (non-Completed/Locked) Visit.
 */
export function assertVisitOpen(visit: Visit): void {
  if (CLOSED_STATUSES.includes(visit.status)) {
    throw new VisitNotOpenException();
  }
}
