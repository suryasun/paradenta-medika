import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { CreatePatientInput, ListPatientsParams, Patient, PatientDetail, UpdatePatientInput } from "../types/patient.types";

// docs/06-tasks/task-001.md, task-027.md..task-030.md
export const patientService = {
  async list(params: ListPatientsParams): Promise<{ items: Patient[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Patient[]>>("/patients", { params });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async detail(id: string): Promise<PatientDetail> {
    const response = await apiClient.get<ApiSuccessBody<PatientDetail>>(`/patients/${id}`);
    return response.data.data;
  },

  async create(payload: CreatePatientInput): Promise<Patient> {
    const response = await apiClient.post<ApiSuccessBody<Patient>>("/patients", payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdatePatientInput): Promise<Patient> {
    const response = await apiClient.put<ApiSuccessBody<Patient>>(`/patients/${id}`, payload);
    return response.data.data;
  },

  async archive(id: string): Promise<Patient> {
    const response = await apiClient.patch<ApiSuccessBody<Patient>>(`/patients/${id}/archive`);
    return response.data.data;
  },

  async restore(id: string): Promise<Patient> {
    const response = await apiClient.patch<ApiSuccessBody<Patient>>(`/patients/${id}/restore`);
    return response.data.data;
  },
};
