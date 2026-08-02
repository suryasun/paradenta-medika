import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { PrescriptionItemEntryInput } from "../types/emr.types";

// docs/06-tasks/task-065.md/task-066.md.
export function usePrescriptionHistory(patientId: string) {
  return useQuery({
    queryKey: ["emr", "prescriptions", patientId],
    queryFn: () => emrService.getPrescriptionHistory(patientId),
    enabled: Boolean(patientId),
  });
}

export function useCreatePrescription(visitId: string, patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: PrescriptionItemEntryInput[]) => emrService.createPrescription(visitId, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "prescriptions", patientId] }),
  });
}

export function usePrescriptionPrint(prescriptionId: string | null) {
  return useQuery({
    queryKey: ["emr", "prescription-print", prescriptionId],
    queryFn: () => emrService.getPrescriptionPrint(prescriptionId as string),
    enabled: prescriptionId !== null,
  });
}
