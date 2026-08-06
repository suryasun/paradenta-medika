export interface PatientResponseDto {
  id: string;
  medicalRecordNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'ARCHIVED';
  // task-284 (Epic PE1)
  insuranceNumber: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  tiktokHandle: string | null;
  whatsappNumber: string | null;
  // task-287 (Epic PE4)
  referralSourceId: string | null;
  referredByUserId: string | null;
  // task-290 (Epic RE1): owned exclusively by this module, kept in sync via
  // a RESERVATION_CREATED_EVENT subscriber.
  patientType: 'NEW' | 'OLD';
  firstReservationAt: string | null;
}

export interface PatientDetailResponseDto {
  id: string;
  medicalRecordNumber: string;
  identity: {
    identityType: string | null;
    identityNumber: string | null;
  };
  profile: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    placeOfBirth: string | null;
    phoneNumber: string;
    email: string | null;
    status: 'ACTIVE' | 'ARCHIVED';
    // task-284 (Epic PE1): "Kontak Tambahan" fields, per
    // docs/02-design/pages/patient.md §14.
    insuranceNumber: string | null;
    instagramHandle: string | null;
    facebookHandle: string | null;
    tiktokHandle: string | null;
    whatsappNumber: string | null;
    // task-287 (Epic PE4)
    referralSourceId: string | null;
    referredByUserId: string | null;
    // task-290 (Epic RE1)
    patientType: 'NEW' | 'OLD';
    firstReservationAt: string | null;
  };
  addresses: string[];
  emergencyContacts: unknown[];
  visitHistory: unknown[];
  reservationHistory: unknown[];
  paymentHistory: unknown[];
}
