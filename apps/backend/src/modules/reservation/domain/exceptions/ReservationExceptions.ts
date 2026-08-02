import { BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

/**
 * Error codes per docs/03-sad/13-module-reservation.md Section 31.3.
 */
export class ReservationNotFoundException extends NotFoundException {
  constructor() {
    super('Reservation not found');
  }
}

export class DoctorScheduleUnavailableException extends ConflictException {
  constructor(message = 'Doctor schedule unavailable') {
    super(message, 'RSV-002');
  }
}

export class TimeSlotAlreadyReservedException extends ConflictException {
  constructor() {
    super('Time slot already reserved', 'RSV-003');
  }
}

export class PatientAlreadyHasActiveReservationException extends ConflictException {
  constructor() {
    super('Patient already has active reservation', 'RSV-004');
  }
}

export class ReservationAlreadyCheckedInException extends BusinessException {
  constructor() {
    super('RSV-005', 'Reservation already checked in');
  }
}

export class ReservationAlreadyCompletedException extends BusinessException {
  constructor() {
    super('RSV-006', 'Reservation already completed');
  }
}

export class ReservationAlreadyCancelledException extends BusinessException {
  constructor() {
    super('RSV-007', 'Reservation already cancelled');
  }
}

export class InvalidReservationStatusException extends BusinessException {
  constructor(message = 'Invalid reservation status for this action') {
    super('RSV-008', message);
  }
}

export class ReservationDateInPastException extends BusinessException {
  constructor() {
    super('RSV-009', 'Reservation date is in the past');
  }
}

/**
 * "Patient must be active" (Section 7.1 General Rules) has no assigned code
 * in the Section 31.3 catalog (only RSV-001..009 are documented) -- a
 * semantic code is used instead of fabricating an RSV-0xx number the SAD
 * never defines.
 */
export class InactivePatientException extends BusinessException {
  constructor() {
    super('PATIENT_NOT_ACTIVE', 'Reservation can only be created for an active patient');
  }
}
