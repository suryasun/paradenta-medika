import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientEmergencyContactService } from "../services/patientEmergencyContact.service";
import { AddEmergencyContactInput, UpdateEmergencyContactInput } from "../types/patient.types";

function invalidateContacts(queryClient: ReturnType<typeof useQueryClient>, patientId: string) {
  return queryClient.invalidateQueries({ queryKey: ["patients", "emergency-contacts", patientId] });
}

export function useAddEmergencyContact(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddEmergencyContactInput) => patientEmergencyContactService.add(patientId, payload),
    onSuccess: () => invalidateContacts(queryClient, patientId),
  });
}

export function useUpdateEmergencyContact(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, payload }: { contactId: string; payload: UpdateEmergencyContactInput }) =>
      patientEmergencyContactService.update(patientId, contactId, payload),
    onSuccess: () => invalidateContacts(queryClient, patientId),
  });
}

export function useDeleteEmergencyContact(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => patientEmergencyContactService.remove(patientId, contactId),
    onSuccess: () => invalidateContacts(queryClient, patientId),
  });
}
