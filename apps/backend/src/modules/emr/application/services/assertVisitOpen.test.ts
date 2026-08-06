import { Visit } from '@prisma/client';
import { assertVisitOpen } from './assertVisitOpen';
import { VisitNotOpenException } from '../../domain/exceptions/EmrExceptions';

function buildVisit(status: Visit['status']): Visit {
  return { status } as Visit;
}

// docs/06-tasks/task-316.md
describe('assertVisitOpen', () => {
  it.each(['DRAFT', 'WAITING_EXAMINATION', 'IN_PROGRESS', 'COMPLETED'] as const)(
    'does not throw for a %s visit',
    (status) => {
      expect(() => assertVisitOpen(buildVisit(status))).not.toThrow();
    },
  );

  it.each(['LOCKED', 'ARCHIVED'] as const)('throws VisitNotOpenException for a %s visit', (status) => {
    expect(() => assertVisitOpen(buildVisit(status))).toThrow(VisitNotOpenException);
  });
});
