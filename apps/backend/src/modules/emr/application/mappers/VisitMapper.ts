import { SoapNote, Visit, VisitDiagnosis, VisitTreatment, VitalSign } from '@prisma/client';
import { VisitTreatmentWithMaterials } from '../../domain/repositories/IVisitTreatmentRepository';
import {
  DiagnosisResponseDto,
  SoapNoteResponseDto,
  TreatmentEntryResponseDto,
  VisitDetailResponseDto,
  VisitResponseDto,
  VitalSignResponseDto,
} from '../dtos/VisitResponseDto';

export function toVisitResponse(visit: Visit): VisitResponseDto {
  return {
    id: visit.id,
    visitNo: visit.visitNo,
    reservationId: visit.reservationId,
    patientId: visit.patientId,
    doctorId: visit.doctorId,
    branchId: visit.branchId,
    queueId: visit.queueId,
    visitDate: visit.visitDate.toISOString(),
    chiefComplaint: visit.chiefComplaint,
    status: visit.status,
    startedAt: visit.startedAt ? visit.startedAt.toISOString() : null,
    finishedAt: visit.finishedAt ? visit.finishedAt.toISOString() : null,
  };
}

function toVitalSignResponse(vitalSign: VitalSign): VitalSignResponseDto {
  return {
    id: vitalSign.id,
    bloodPressure: vitalSign.bloodPressure,
    heartRate: vitalSign.heartRate,
    respiratoryRate: vitalSign.respiratoryRate,
    temperature: vitalSign.temperature ? Number(vitalSign.temperature) : null,
    weight: vitalSign.weight ? Number(vitalSign.weight) : null,
    height: vitalSign.height ? Number(vitalSign.height) : null,
    oxygenSaturation: vitalSign.oxygenSaturation,
    recordedAt: vitalSign.recordedAt.toISOString(),
  };
}

function toSoapNoteResponse(soapNote: SoapNote): SoapNoteResponseDto {
  return {
    subjective: soapNote.subjective,
    objective: soapNote.objective,
    assessment: soapNote.assessment,
    plan: soapNote.plan,
  };
}

function toDiagnosisResponse(diagnosis: VisitDiagnosis): DiagnosisResponseDto {
  return {
    id: diagnosis.id,
    diagnosisType: diagnosis.diagnosisType,
    diagnosisName: diagnosis.diagnosisName,
    notes: diagnosis.notes,
  };
}

function toTreatmentEntryResponse(entry: VisitTreatment & { materials?: Array<{ itemId: string; quantity: unknown }> }): TreatmentEntryResponseDto {
  return {
    id: entry.id,
    treatmentId: entry.treatmentId,
    toothReference: entry.toothReference,
    quantity: entry.quantity,
    unitPrice: Number(entry.unitPrice),
    subtotal: Number(entry.subtotal),
    notes: entry.notes,
    materials: (entry.materials ?? []).map((m) => ({ itemId: m.itemId, quantity: Number(m.quantity) })),
  };
}

export function toVisitDetailResponse(
  visit: Visit,
  vitalSigns: VitalSign[],
  soapNote: SoapNote | null,
  diagnoses: VisitDiagnosis[],
  treatmentEntries: VisitTreatmentWithMaterials[],
): VisitDetailResponseDto {
  return {
    ...toVisitResponse(visit),
    vitalSigns: vitalSigns.map(toVitalSignResponse),
    soapNote: soapNote ? toSoapNoteResponse(soapNote) : null,
    diagnoses: diagnoses.map(toDiagnosisResponse),
    treatmentEntries: treatmentEntries.map(toTreatmentEntryResponse),
  };
}
