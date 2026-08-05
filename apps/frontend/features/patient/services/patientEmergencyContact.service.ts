import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { AddEmergencyContactInput, PatientEmergencyContact, UpdateEmergencyContactInput } from "../types/patient.types";

// task-288 (Epic PE5, Patient Module Enhancement addendum)
export const patientEmergencyContactService = {
  async list(patientId: string): Promise<PatientEmergencyContact[]> {
    const response = await apiClient.get<ApiSuccessBody<PatientEmergencyContact[]>>(`/patients/${patientId}/emergency-contacts`);
    return response.data.data;
  },

  async add(patientId: string, payload: AddEmergencyContactInput): Promise<PatientEmergencyContact> {
    const response = await apiClient.post<ApiSuccessBody<PatientEmergencyContact>>(`/patients/${patientId}/emergency-contacts`, payload);
    return response.data.data;
  },

  async update(patientId: string, contactId: string, payload: UpdateEmergencyContactInput): Promise<PatientEmergencyContact> {
    const response = await apiClient.patch<ApiSuccessBody<PatientEmergencyContact>>(
      `/patients/${patientId}/emergency-contacts/${contactId}`,
      payload,
    );
    return response.data.data;
  },

  async remove(patientId: string, contactId: string): Promise<void> {
    await apiClient.delete(`/patients/${patientId}/emergency-contacts/${contactId}`);
  },
};
