import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { AddPatientAddressInput, PatientAddress, UpdatePatientAddressInput } from "../types/patient.types";

// task-286 (Epic PE3, Patient Module Enhancement addendum)
export const patientAddressService = {
  async list(patientId: string): Promise<PatientAddress[]> {
    const response = await apiClient.get<ApiSuccessBody<PatientAddress[]>>(`/patients/${patientId}/addresses`);
    return response.data.data;
  },

  async add(patientId: string, payload: AddPatientAddressInput): Promise<PatientAddress> {
    const response = await apiClient.post<ApiSuccessBody<PatientAddress>>(`/patients/${patientId}/addresses`, payload);
    return response.data.data;
  },

  async update(patientId: string, addressId: string, payload: UpdatePatientAddressInput): Promise<PatientAddress> {
    const response = await apiClient.patch<ApiSuccessBody<PatientAddress>>(`/patients/${patientId}/addresses/${addressId}`, payload);
    return response.data.data;
  },

  async remove(patientId: string, addressId: string, newPrimaryAddressId?: string): Promise<void> {
    await apiClient.delete(`/patients/${patientId}/addresses/${addressId}`, { data: { newPrimaryAddressId } });
  },

  async setPrimary(patientId: string, addressId: string): Promise<PatientAddress> {
    const response = await apiClient.post<ApiSuccessBody<PatientAddress>>(`/patients/${patientId}/addresses/${addressId}/set-primary`);
    return response.data.data;
  },
};
