import { ConflictException, NotFoundException, ValidationException } from '../../../../shared/http/exceptions';

/**
 * docs/03-sad/14-module-queue.md Section 63 Error Handling.
 */
export class QueueNotFoundException extends NotFoundException {
  constructor() {
    super('Queue not found');
  }
}

/**
 * "Invalid State" -> 409 Conflict per Section 63 (e.g. "Queue already
 * completed."), used for any transition docs/03-sad/14-module-queue.md
 * Section 23's state diagram does not permit.
 */
export class InvalidQueueTransitionException extends ConflictException {
  constructor(message = 'Invalid queue state transition') {
    super(message, 'QUEUE_INVALID_STATE');
  }
}

/**
 * docs/03-sad/14-module-queue.md Section 21 Rule 1: "Satu pasien hanya
 * boleh memiliki satu Queue aktif pada satu cabang dalam satu hari."
 * Section 63 example message: "Patient already has active queue."
 */
export class PatientAlreadyHasActiveQueueException extends ValidationException {
  constructor() {
    super([{ field: 'patientId', message: 'Patient already has active queue' }], 'Patient already has active queue');
  }
}
