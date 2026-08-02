import { InvalidQueueTransitionException } from '../../domain/exceptions/QueueExceptions';

/**
 * docs/03-sad/14-module-queue.md Section 23 Queue State Transition -- the
 * exact, authoritative transition table ("Status yang tidak terdapat pada
 * diagram dianggap tidak valid" / any transition not shown is invalid):
 *
 *   WAITING -> CALLED
 *   CALLED -> IN_SERVICE
 *   IN_SERVICE -> COMPLETED
 *   WAITING -> CANCELLED
 *   WAITING -> NO_SHOW
 *   WAITING -> SKIPPED
 *   SKIPPED -> CALLED
 *
 * Several task docs describe transitions more loosely than this diagram
 * (task-042 explicitly says to follow Section 23 rather than assume;
 * task-045 says Cancel is allowed from "WAITING/CALLED", which the
 * diagram does not show). Section 23's closing sentence makes it the
 * authoritative source for every transition, so it is applied uniformly
 * here rather than only where a task happens to call it out.
 */
export function assertQueueTransition(currentStatus: string, allowedFrom: string[]): void {
  if (!allowedFrom.includes(currentStatus)) {
    throw new InvalidQueueTransitionException(
      `Queue cannot transition from ${currentStatus} (allowed from: ${allowedFrom.join(', ')})`,
    );
  }
}
