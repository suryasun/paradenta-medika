import { InvalidDateOfBirthException } from '../exceptions/PatientExceptions';

export type PatientGenderValue = 'MALE' | 'FEMALE';
export type PatientIdentityTypeValue = 'KTP' | 'PASSPORT' | 'SIM';

export interface PatientProps {
  patientName: string;
  gender: PatientGenderValue;
  birthDate: Date;
  birthPlace?: string;
  identityType?: PatientIdentityTypeValue;
  identityNumber?: string;
  phone: string;
  email?: string;
  address: string;
}

/**
 * Patient Aggregate Root (docs/03-sad/12-module-patient.md Section 14.1).
 * Enforces the business invariant not expressible through DTO field
 * validation alone: date of birth must not be in the future
 * (Section 16.2 Business Validation).
 */
export class PatientEntity {
  private constructor(readonly props: PatientProps) {}

  static create(props: PatientProps): PatientEntity {
    if (props.birthDate.getTime() > Date.now()) {
      throw new InvalidDateOfBirthException();
    }
    return new PatientEntity(props);
  }
}
