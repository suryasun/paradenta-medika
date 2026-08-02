// Mirrors apps/backend/src/modules/patient/application/dtos/PatientResponseDto.ts
export interface Patient {
  id: string;
  medicalRecordNumber: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  phoneNumber: string;
  status: "ACTIVE" | "ARCHIVED";
}

export interface PatientDetail {
  id: string;
  medicalRecordNumber: string;
  identity: {
    identityType: string | null;
    identityNumber: string | null;
  };
  profile: {
    fullName: string;
    gender: "MALE" | "FEMALE";
    dateOfBirth: string;
    placeOfBirth: string | null;
    phoneNumber: string;
    email: string | null;
    status: "ACTIVE" | "ARCHIVED";
  };
  addresses: string[];
  // Always empty in Phase 1 -- apps/backend's PatientMapper.toPatientDetailResponse
  // hardcodes these to [] pending a cross-module history-aggregation query
  // against Reservation/EMR/Billing (not yet built, even though those
  // modules now exist). Tabs rendering these arrays show an EmptyState.
  emergencyContacts: unknown[];
  visitHistory: unknown[];
  reservationHistory: unknown[];
  paymentHistory: unknown[];
}

export interface CreatePatientInput {
  fullName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  placeOfBirth?: string;
  phoneNumber: string;
  email?: string;
  identityType?: "KTP" | "PASSPORT" | "SIM";
  identityNumber?: string;
  address: string;
}

export interface UpdatePatientInput {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export interface ListPatientsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "ARCHIVED";
  gender?: "MALE" | "FEMALE";
}
