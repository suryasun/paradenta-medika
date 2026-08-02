import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { Reservation } from "@/features/reservation/types/reservation.types";
import {
  Allergy,
  AnnotateAttachmentInput,
  Attachment,
  AttachmentAnnotation,
  AttachmentDetail,
  AttachmentVersion,
  Consent,
  ConvertTreatmentPlanToReservationInput,
  CreateConsentInput,
  CreateFollowUpInput,
  CreateReferralInput,
  Diagnosis,
  DiagnosisEntryInput,
  DownloadAttachmentResult,
  FollowUp,
  IssueMedicalCertificateInput,
  MedicalCertificate,
  MedicalHistory,
  OdontogramEntry,
  PeriodontalAssessment,
  PeriodontalAssessmentDetail,
  PeriodontalMeasurement,
  Prescription,
  PrescriptionItemEntryInput,
  PrescriptionPrint,
  RecordAllergyInput,
  RecordMedicalHistoryInput,
  RecordToothConditionInput,
  RecordTreatmentInput,
  RecordVitalSignInput,
  Referral,
  SaveMeasurementInput,
  SignConsentInput,
  SoapNote,
  SoapNoteInput,
  TimelineEvent,
  TimelineEventType,
  TimelineSummary,
  TreatmentEntry,
  TreatmentPlanItem,
  TreatmentPlanItemEntryInput,
  UpdateMeasurementInput,
  UploadAttachmentInput,
  Visit,
  VisitDetail,
  VitalSign,
} from "../types/emr.types";

// docs/06-tasks/task-048.md..task-053.md
export const emrService = {
  async openVisit(queueId: string, chiefComplaint?: string): Promise<Visit> {
    const response = await apiClient.post<ApiSuccessBody<Visit>>("/emr/visits", { queueId, chiefComplaint });
    return response.data.data;
  },

  async detail(id: string): Promise<VisitDetail> {
    const response = await apiClient.get<ApiSuccessBody<VisitDetail>>(`/emr/visits/${id}`);
    return response.data.data;
  },

  async recordVitalSign(visitId: string, payload: RecordVitalSignInput): Promise<VitalSign> {
    const response = await apiClient.post<ApiSuccessBody<VitalSign>>(`/emr/visits/${visitId}/vital-signs`, payload);
    return response.data.data;
  },

  async saveSoapNote(visitId: string, payload: SoapNoteInput): Promise<SoapNote> {
    const response = await apiClient.put<ApiSuccessBody<SoapNote>>(`/emr/visits/${visitId}/soap-note`, payload);
    return response.data.data;
  },

  async recordDiagnoses(visitId: string, diagnoses: DiagnosisEntryInput[]): Promise<Diagnosis[]> {
    const response = await apiClient.post<ApiSuccessBody<Diagnosis[]>>(`/emr/visits/${visitId}/diagnoses`, { diagnoses });
    return response.data.data;
  },

  async recordTreatment(visitId: string, payload: RecordTreatmentInput): Promise<TreatmentEntry> {
    const response = await apiClient.post<ApiSuccessBody<TreatmentEntry>>(`/emr/visits/${visitId}/treatments`, payload);
    return response.data.data;
  },

  async closeVisit(visitId: string): Promise<Visit> {
    const response = await apiClient.post<ApiSuccessBody<Visit>>(`/emr/visits/${visitId}/close`);
    return response.data.data;
  },

  // docs/06-tasks/task-061.md/task-062.md: Patient-scoped, not Visit-scoped.
  async getMedicalHistory(patientId: string): Promise<MedicalHistory[]> {
    const response = await apiClient.get<ApiSuccessBody<MedicalHistory[]>>(`/patients/${patientId}/medical-history`);
    return response.data.data;
  },

  async recordMedicalHistory(patientId: string, payload: RecordMedicalHistoryInput): Promise<MedicalHistory> {
    const response = await apiClient.post<ApiSuccessBody<MedicalHistory>>(`/patients/${patientId}/medical-history`, payload);
    return response.data.data;
  },

  async getAllergies(patientId: string): Promise<Allergy[]> {
    const response = await apiClient.get<ApiSuccessBody<Allergy[]>>(`/patients/${patientId}/allergies`);
    return response.data.data;
  },

  async recordAllergy(patientId: string, payload: RecordAllergyInput): Promise<Allergy> {
    const response = await apiClient.post<ApiSuccessBody<Allergy>>(`/patients/${patientId}/allergies`, payload);
    return response.data.data;
  },

  // docs/06-tasks/task-068.md/069.md/070.md.
  async recordToothCondition(visitId: string, payload: RecordToothConditionInput): Promise<OdontogramEntry> {
    const response = await apiClient.post<ApiSuccessBody<OdontogramEntry>>(`/emr/visits/${visitId}/odontogram`, payload);
    return response.data.data;
  },

  async getCurrentOdontogram(patientId: string): Promise<OdontogramEntry[]> {
    const response = await apiClient.get<ApiSuccessBody<OdontogramEntry[]>>(`/patients/${patientId}/odontogram`);
    return response.data.data;
  },

  async getToothHistory(patientId: string, toothNumber: number): Promise<OdontogramEntry[]> {
    const response = await apiClient.get<ApiSuccessBody<OdontogramEntry[]>>(`/patients/${patientId}/odontogram/${toothNumber}/history`);
    return response.data.data;
  },

  // docs/06-tasks/task-063.md/task-064.md.
  async createTreatmentPlan(visitId: string, items: TreatmentPlanItemEntryInput[]): Promise<TreatmentPlanItem[]> {
    const response = await apiClient.post<ApiSuccessBody<TreatmentPlanItem[]>>(`/emr/visits/${visitId}/treatment-plan`, { items });
    return response.data.data;
  },

  async getTreatmentPlan(visitId: string): Promise<TreatmentPlanItem[]> {
    const response = await apiClient.get<ApiSuccessBody<TreatmentPlanItem[]>>(`/emr/visits/${visitId}/treatment-plan`);
    return response.data.data;
  },

  async convertTreatmentPlanItemToReservation(itemId: string, payload: ConvertTreatmentPlanToReservationInput): Promise<Reservation> {
    const response = await apiClient.post<ApiSuccessBody<Reservation>>(`/emr/treatment-plan/${itemId}/convert-to-reservation`, payload);
    return response.data.data;
  },

  // docs/06-tasks/task-071.md..task-077.md.
  async createPeriodontalAssessment(visitId: string, patientId: string, doctorId: string): Promise<PeriodontalAssessment> {
    const response = await apiClient.post<ApiSuccessBody<PeriodontalAssessment>>('/emr/periodontal-assessments', { visitId, patientId, doctorId });
    return response.data.data;
  },

  async getPeriodontalAssessment(assessmentId: string): Promise<PeriodontalAssessmentDetail> {
    const response = await apiClient.get<ApiSuccessBody<PeriodontalAssessmentDetail>>(`/emr/periodontal-assessments/${assessmentId}`);
    return response.data.data;
  },

  async getPeriodontalAssessmentHistory(assessmentId: string): Promise<PeriodontalAssessment[]> {
    const response = await apiClient.get<ApiSuccessBody<PeriodontalAssessment[]>>(`/emr/periodontal-assessments/${assessmentId}/history`);
    return response.data.data;
  },

  async lockPeriodontalAssessment(assessmentId: string): Promise<PeriodontalAssessment> {
    const response = await apiClient.post<ApiSuccessBody<PeriodontalAssessment>>(`/emr/periodontal-assessments/${assessmentId}/lock`);
    return response.data.data;
  },

  async addPeriodontalMeasurement(assessmentId: string, payload: SaveMeasurementInput): Promise<PeriodontalMeasurement> {
    const response = await apiClient.post<ApiSuccessBody<PeriodontalMeasurement>>(
      `/emr/periodontal-assessments/${assessmentId}/measurements`,
      payload,
    );
    return response.data.data;
  },

  async updatePeriodontalMeasurement(assessmentId: string, id: string, payload: UpdateMeasurementInput): Promise<PeriodontalMeasurement> {
    const response = await apiClient.put<ApiSuccessBody<PeriodontalMeasurement>>(
      `/emr/periodontal-assessments/${assessmentId}/measurements/${id}`,
      payload,
    );
    return response.data.data;
  },

  async deletePeriodontalMeasurement(assessmentId: string, id: string): Promise<void> {
    await apiClient.delete(`/emr/periodontal-assessments/${assessmentId}/measurements/${id}`);
  },

  // docs/06-tasks/task-089.md/task-090.md.
  async createReferral(visitId: string, payload: CreateReferralInput): Promise<Referral> {
    const response = await apiClient.post<ApiSuccessBody<Referral>>(`/emr/visits/${visitId}/referrals`, payload);
    return response.data.data;
  },

  async getReferrals(visitId: string): Promise<Referral[]> {
    const response = await apiClient.get<ApiSuccessBody<Referral[]>>(`/emr/visits/${visitId}/referrals`);
    return response.data.data;
  },

  async createFollowUp(visitId: string, payload: CreateFollowUpInput): Promise<FollowUp> {
    const response = await apiClient.post<ApiSuccessBody<FollowUp>>(`/emr/visits/${visitId}/follow-ups`, payload);
    return response.data.data;
  },

  async getFollowUps(visitId: string): Promise<FollowUp[]> {
    const response = await apiClient.get<ApiSuccessBody<FollowUp[]>>(`/emr/visits/${visitId}/follow-ups`);
    return response.data.data;
  },

  // docs/06-tasks/task-078.md..task-084.md.
  async uploadAttachment(payload: UploadAttachmentInput): Promise<Attachment> {
    const formData = new FormData();
    formData.append("visitId", payload.visitId);
    formData.append("patientId", payload.patientId);
    formData.append("category", payload.category);
    if (payload.attachmentType) formData.append("attachmentType", payload.attachmentType);
    if (payload.attachmentId) formData.append("attachmentId", payload.attachmentId);
    formData.append("file", payload.file);
    const response = await apiClient.post<ApiSuccessBody<Attachment>>("/emr/attachments", formData);
    return response.data.data;
  },

  async getAttachmentDetail(id: string): Promise<AttachmentDetail> {
    const response = await apiClient.get<ApiSuccessBody<AttachmentDetail>>(`/emr/attachments/${id}`);
    return response.data.data;
  },

  async downloadAttachment(id: string): Promise<DownloadAttachmentResult> {
    const response = await apiClient.get<ApiSuccessBody<DownloadAttachmentResult>>(`/emr/attachments/${id}/download`);
    return response.data.data;
  },

  async annotateAttachment(id: string, payload: AnnotateAttachmentInput): Promise<AttachmentAnnotation> {
    const response = await apiClient.post<ApiSuccessBody<AttachmentAnnotation>>(`/emr/attachments/${id}/annotations`, payload);
    return response.data.data;
  },

  async listVisitAttachments(visitId: string): Promise<Attachment[]> {
    const response = await apiClient.get<ApiSuccessBody<Attachment[]>>(`/emr/visits/${visitId}/attachments`);
    return response.data.data;
  },

  async archiveAttachment(id: string): Promise<Attachment> {
    const response = await apiClient.post<ApiSuccessBody<Attachment>>(`/emr/attachments/${id}/archive`);
    return response.data.data;
  },

  async getAttachmentVersions(id: string): Promise<AttachmentVersion[]> {
    const response = await apiClient.get<ApiSuccessBody<AttachmentVersion[]>>(`/emr/attachments/${id}/versions`);
    return response.data.data;
  },

  async restoreAttachmentVersion(id: string, versionNumber: number): Promise<Attachment> {
    const response = await apiClient.post<ApiSuccessBody<Attachment>>(`/emr/attachments/${id}/versions/${versionNumber}/restore`);
    return response.data.data;
  },

  // docs/06-tasks/task-065.md/task-066.md.
  async createPrescription(visitId: string, items: PrescriptionItemEntryInput[]): Promise<Prescription> {
    const response = await apiClient.post<ApiSuccessBody<Prescription>>(`/emr/visits/${visitId}/prescriptions`, { items });
    return response.data.data;
  },

  async getPrescriptionHistory(patientId: string): Promise<Prescription[]> {
    const response = await apiClient.get<ApiSuccessBody<Prescription[]>>(`/patients/${patientId}/prescriptions`);
    return response.data.data;
  },

  async getPrescriptionPrint(prescriptionId: string): Promise<PrescriptionPrint> {
    const response = await apiClient.get<ApiSuccessBody<PrescriptionPrint>>(`/emr/prescriptions/${prescriptionId}/print`);
    return response.data.data;
  },

  // docs/06-tasks/task-086.md/task-087.md.
  async createConsent(payload: CreateConsentInput): Promise<Consent> {
    const response = await apiClient.post<ApiSuccessBody<Consent>>("/emr/consents", payload);
    return response.data.data;
  },

  async signConsent(consentId: string, payload: SignConsentInput): Promise<Consent> {
    const response = await apiClient.post<ApiSuccessBody<Consent>>(`/emr/consents/${consentId}/sign`, payload);
    return response.data.data;
  },

  async getPatientConsents(patientId: string): Promise<Consent[]> {
    const response = await apiClient.get<ApiSuccessBody<Consent[]>>(`/patients/${patientId}/consents`);
    return response.data.data;
  },

  // docs/06-tasks/task-088.md.
  async issueMedicalCertificate(visitId: string, payload: IssueMedicalCertificateInput): Promise<MedicalCertificate> {
    const response = await apiClient.post<ApiSuccessBody<MedicalCertificate>>(`/emr/visits/${visitId}/medical-certificates`, payload);
    return response.data.data;
  },

  async getPatientMedicalCertificates(patientId: string): Promise<MedicalCertificate[]> {
    const response = await apiClient.get<ApiSuccessBody<MedicalCertificate[]>>(`/patients/${patientId}/medical-certificates`);
    return response.data.data;
  },

  // docs/06-tasks/task-091.md..task-094.md.
  async getPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
    const response = await apiClient.get<ApiSuccessBody<TimelineEvent[]>>(`/emr/timeline/${patientId}`);
    return response.data.data;
  },

  async getPatientTimelineSummary(patientId: string): Promise<TimelineSummary> {
    const response = await apiClient.get<ApiSuccessBody<TimelineSummary>>(`/emr/timeline/${patientId}/summary`);
    return response.data.data;
  },

  async getPatientTimelineEvents(patientId: string, eventType?: TimelineEventType): Promise<TimelineEvent[]> {
    const response = await apiClient.get<ApiSuccessBody<TimelineEvent[]>>(`/emr/timeline/${patientId}/events`, {
      params: eventType ? { eventType } : undefined,
    });
    return response.data.data;
  },

  async getPatientTimelineAttachments(patientId: string): Promise<Attachment[]> {
    const response = await apiClient.get<ApiSuccessBody<Attachment[]>>(`/emr/timeline/${patientId}/attachments`);
    return response.data.data;
  },
};
