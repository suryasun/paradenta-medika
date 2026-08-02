import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import {
  Diagnosis,
  DiagnosisEntryInput,
  RecordTreatmentInput,
  RecordVitalSignInput,
  SoapNote,
  SoapNoteInput,
  TreatmentEntry,
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
};
