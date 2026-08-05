import { BusinessException, NotFoundException } from '../../../../shared/http/exceptions';

/**
 * Error codes per docs/03-sad/12-module-patient.md Section 24.2.
 */
export class PatientNotFoundException extends NotFoundException {
  constructor() {
    super('Patient not found');
  }
}

export class DuplicateIdentityException extends BusinessException {
  constructor() {
    super('DUPLICATE_IDENTITY', 'Identity number already exists');
  }
}

export class InvalidDateOfBirthException extends BusinessException {
  constructor() {
    super('INVALID_DATE_OF_BIRTH', 'Date of birth must not be in the future');
  }
}

export class MedicalRecordNumberImmutableException extends BusinessException {
  constructor() {
    super('MEDICAL_RECORD_NUMBER_IMMUTABLE', 'Medical Record Number cannot be changed');
  }
}

// task-286 (Epic PE3, Patient Module Enhancement addendum)
export class PatientAddressNotFoundException extends NotFoundException {
  constructor() {
    super('Patient address not found');
  }
}

/** A provinceId/regencyId/districtId/villageId doesn't exist, isn't active, or its parent chain doesn't match -- task-286's own Acceptance Criteria. */
export class PatientAddressRegionMismatchException extends BusinessException {
  constructor(message: string) {
    super('PATIENT_ADDRESS_REGION_MISMATCH', message);
  }
}

/** Deleting the primary address while other addresses remain requires the caller to designate a new primary in the same request -- task-286's own Testing Required note. */
export class PatientAddressPrimaryRequiredException extends BusinessException {
  constructor() {
    super('PATIENT_ADDRESS_PRIMARY_REQUIRED', 'Deleting the primary address requires designating a new primary address');
  }
}

// task-287 (Epic PE4): a submitted referralSourceId doesn't exist or isn't
// active. referredByUserId is deliberately never validated server-side
// (task's own AC: "the server never requires it even then").
export class PatientReferralSourceInvalidException extends BusinessException {
  constructor() {
    super('PATIENT_REFERRAL_SOURCE_INVALID', 'referralSourceId does not exist or is not active');
  }
}

// task-288 (Epic PE5, Patient Module Enhancement addendum)
export class PatientEmergencyContactNotFoundException extends NotFoundException {
  constructor() {
    super('Patient emergency contact not found');
  }
}
