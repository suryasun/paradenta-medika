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
