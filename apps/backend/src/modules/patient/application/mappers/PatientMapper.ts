import { Patient } from '@prisma/client';
import { PatientDetailResponseDto, PatientResponseDto } from '../dtos/PatientResponseDto';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toStatus(patient: Patient): 'ACTIVE' | 'ARCHIVED' {
  return patient.active ? 'ACTIVE' : 'ARCHIVED';
}

export function toPatientResponse(patient: Patient): PatientResponseDto {
  return {
    id: patient.id,
    medicalRecordNumber: patient.medicalRecordNo,
    fullName: patient.patientName,
    gender: patient.gender,
    dateOfBirth: toIsoDate(patient.birthDate),
    phoneNumber: patient.phone,
    status: toStatus(patient),
    insuranceNumber: patient.insuranceNumber,
    instagramHandle: patient.instagramHandle,
    facebookHandle: patient.facebookHandle,
    tiktokHandle: patient.tiktokHandle,
    whatsappNumber: patient.whatsappNumber,
    referralSourceId: patient.referralSourceId,
    referredByUserId: patient.referredByUserId,
    patientType: patient.patientType,
    firstReservationAt: patient.firstReservationAt ? patient.firstReservationAt.toISOString() : null,
  };
}

/**
 * docs/06-tasks/task-028.md Phase 1 note: Reservation/Visit/Payment History
 * tabs return empty collections gracefully until Epics E/G/H exist.
 */
export function toPatientDetailResponse(patient: Patient): PatientDetailResponseDto {
  return {
    id: patient.id,
    medicalRecordNumber: patient.medicalRecordNo,
    identity: {
      identityType: patient.identityType,
      identityNumber: patient.identityNumber,
    },
    profile: {
      fullName: patient.patientName,
      gender: patient.gender,
      dateOfBirth: toIsoDate(patient.birthDate),
      placeOfBirth: patient.birthPlace,
      phoneNumber: patient.phone,
      email: patient.email,
      status: toStatus(patient),
      insuranceNumber: patient.insuranceNumber,
      instagramHandle: patient.instagramHandle,
      facebookHandle: patient.facebookHandle,
      tiktokHandle: patient.tiktokHandle,
      whatsappNumber: patient.whatsappNumber,
      referralSourceId: patient.referralSourceId,
      referredByUserId: patient.referredByUserId,
      patientType: patient.patientType,
      firstReservationAt: patient.firstReservationAt ? patient.firstReservationAt.toISOString() : null,
    },
    addresses: [patient.address],
    emergencyContacts: [],
    visitHistory: [],
    reservationHistory: [],
    paymentHistory: [],
  };
}
