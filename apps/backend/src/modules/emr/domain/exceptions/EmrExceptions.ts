import { BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

export class VisitNotFoundException extends NotFoundException {
  constructor() {
    super('Visit not found');
  }
}

/** docs/03-sad/15-module-emr.md Section 15: "Visit hanya dapat dibuat dari Queue berstatus Called." */
export class QueueNotCalledException extends BusinessException {
  constructor() {
    super('QUEUE_NOT_CALLED', 'Visit can only be opened from a queue in CALLED status');
  }
}

/** Section 15: "Satu Queue hanya dapat memiliki satu Visit." */
export class QueueAlreadyHasVisitException extends ConflictException {
  constructor() {
    super('Queue already has a visit', 'QUEUE_ALREADY_HAS_VISIT');
  }
}

/** Clinical documentation can only be recorded while the Visit is open (not Completed/Locked/Archived). */
export class VisitNotOpenException extends BusinessException {
  constructor() {
    super('VISIT_NOT_OPEN', 'Visit is not open for documentation');
  }
}

/** Section 15: "Visit tidak dapat dihapus setelah Completed." */
export class VisitAlreadyCompletedException extends BusinessException {
  constructor() {
    super('VISIT_ALREADY_COMPLETED', 'Visit has already been completed');
  }
}

/** docs/06-tasks/task-025.md: a deactivated Treatment catalog item cannot be selected. */
export class TreatmentNotActiveException extends BusinessException {
  constructor() {
    super('TREATMENT_NOT_ACTIVE', 'Treatment catalog item is not active');
  }
}

/**
 * docs/06-tasks/task-052.md: minimum documentation (SOAP note + at least
 * one Treatment entry) is required before a Visit can be closed.
 */
export class MinimumDocumentationException extends BusinessException {
  constructor(reasons: string[]) {
    super('MINIMUM_DOCUMENTATION_NOT_MET', `Visit cannot be closed: ${reasons.join('; ')}`);
  }
}
