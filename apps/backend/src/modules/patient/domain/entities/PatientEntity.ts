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
  // task-284: free-text supplementary contact/identity fields, none
  // unique/required/format-validated per the task's Backend Scope.
  insuranceNumber?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  tiktokHandle?: string;
  whatsappNumber?: string;
  // task-287 (Epic PE4): marketing/lead-source tracking, distinct from
  // the clinical `Referral` entity (EMR module) -- never conflated.
  referralSourceId?: string;
  referredByUserId?: string;
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
