// Mirrors apps/backend/src/modules/patient/application/dtos/PatientResponseDto.ts
export interface Patient {
  id: string;
  medicalRecordNumber: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  phoneNumber: string;
  status: "ACTIVE" | "ARCHIVED";
  // task-284 (Epic PE1, Patient Module Enhancement addendum)
  insuranceNumber: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  tiktokHandle: string | null;
  whatsappNumber: string | null;
  // task-287 (Epic PE4)
  referralSourceId: string | null;
  referredByUserId: string | null;
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
  // task-284 (Epic PE1)
  insuranceNumber?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  tiktokHandle?: string;
  whatsappNumber?: string;
  // task-287 (Epic PE4): referredByUserId is only meaningful when the
  // selected source has requiresReferrer:true, but the server never
  // requires it -- the client is responsible for prompting.
  referralSourceId?: string;
  referredByUserId?: string;
}

export interface UpdatePatientInput {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  // task-284 (Epic PE1)
  insuranceNumber?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  tiktokHandle?: string;
  whatsappNumber?: string;
  // task-287 (Epic PE4)
  referralSourceId?: string;
  referredByUserId?: string;
  // task-289 (Epic PE6): lets staff correct the placeholder gender/
  // dateOfBirth a Quick Add patient was created with.
  gender?: "MALE" | "FEMALE";
  dateOfBirth?: string;
}

// task-289 (Epic PE6, Patient Module Enhancement addendum). Deliberately
// flat and minimal per docs/03-sad/12-module-patient.md §21.1a -- no
// gender/dateOfBirth/email, unlike CreatePatientInput. `address` is a
// plain string here too.
export interface QuickAddPatientInput {
  fullName: string;
  address: string;
  phoneNumber: string;
  identityNumber: string;
}

// task-286 (Epic PE3, Patient Module Enhancement addendum). Mirrors
// apps/backend's PatientAddressResponseDto -- each FK is resolved to an
// { id, name } pair server-side so address cards don't need a second
// round trip just to render readable labels.
export interface PatientAddress {
  id: string;
  province: { id: string; name: string };
  regency: { id: string; name: string };
  district: { id: string; name: string };
  village: { id: string; name: string };
  addressLine: string;
  postalCode: string | null;
  isPrimary: boolean;
}

export interface AddPatientAddressInput {
  provinceId: string;
  regencyId: string;
  districtId: string;
  villageId: string;
  addressLine: string;
  postalCode?: string;
  isPrimary?: boolean;
}

export interface UpdatePatientAddressInput {
  provinceId?: string;
  regencyId?: string;
  districtId?: string;
  villageId?: string;
  addressLine?: string;
  postalCode?: string;
  isPrimary?: boolean;
}

// task-288 (Epic PE5, Patient Module Enhancement addendum). Mirrors
// apps/backend's PatientEmergencyContact Prisma model directly -- no
// dedicated response DTO server-side. Field names (contactName/phone) come
// from docs/03-sad/07-data-dictionary.md §12.5's literal column list.
export interface PatientEmergencyContact {
  id: string;
  patientId: string;
  contactName: string;
  relationship: string;
  phone: string;
  address: string | null;
}

export interface AddEmergencyContactInput {
  contactName: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface UpdateEmergencyContactInput {
  contactName?: string;
  relationship?: string;
  phone?: string;
  address?: string;
}

export interface ListPatientsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "ARCHIVED";
  gender?: "MALE" | "FEMALE";
}
