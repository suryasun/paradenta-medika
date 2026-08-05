import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientAddressService } from "../services/patientAddress.service";
import { AddPatientAddressInput, UpdatePatientAddressInput } from "../types/patient.types";

function invalidateAddresses(queryClient: ReturnType<typeof useQueryClient>, patientId: string) {
  return queryClient.invalidateQueries({ queryKey: ["patients", "addresses", patientId] });
}

export function useAddPatientAddress(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddPatientAddressInput) => patientAddressService.add(patientId, payload),
    onSuccess: () => invalidateAddresses(queryClient, patientId),
  });
}

export function useUpdatePatientAddress(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, payload }: { addressId: string; payload: UpdatePatientAddressInput }) =>
      patientAddressService.update(patientId, addressId, payload),
    onSuccess: () => invalidateAddresses(queryClient, patientId),
  });
}

export function useDeletePatientAddress(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, newPrimaryAddressId }: { addressId: string; newPrimaryAddressId?: string }) =>
      patientAddressService.remove(patientId, addressId, newPrimaryAddressId),
    onSuccess: () => invalidateAddresses(queryClient, patientId),
  });
}

export function useSetPrimaryPatientAddress(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => patientAddressService.setPrimary(patientId, addressId),
    onSuccess: () => invalidateAddresses(queryClient, patientId),
  });
}
