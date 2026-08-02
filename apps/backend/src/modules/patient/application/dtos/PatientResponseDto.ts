export interface PatientResponseDto {
  id: string;
  medicalRecordNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'ARCHIVED';
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
  };
  addresses: string[];
  emergencyContacts: unknown[];
  visitHistory: unknown[];
  reservationHistory: unknown[];
  paymentHistory: unknown[];
}
