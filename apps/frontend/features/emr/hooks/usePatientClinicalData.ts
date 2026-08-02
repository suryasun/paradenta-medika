import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { RecordAllergyInput, RecordMedicalHistoryInput, RecordToothConditionInput } from "../types/emr.types";

// docs/06-tasks/task-061.md/task-062.md: Patient-scoped Clinical Alert data,
// queried by patientId (not visitId) so it stays available across visits.
export function useMedicalHistory(patientId: string) {
  return useQuery({
    queryKey: ["emr", "medical-history", patientId],
    queryFn: () => emrService.getMedicalHistory(patientId),
    enabled: Boolean(patientId),
  });
}

export function useAllergies(patientId: string) {
  return useQuery({
    queryKey: ["emr", "allergies", patientId],
    queryFn: () => emrService.getAllergies(patientId),
    enabled: Boolean(patientId),
  });
}

export function useRecordMedicalHistory(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordMedicalHistoryInput) => emrService.recordMedicalHistory(patientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "medical-history", patientId] }),
  });
}

export function useRecordAllergy(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordAllergyInput) => emrService.recordAllergy(patientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "allergies", patientId] }),
  });
}

// docs/06-tasks/task-069.md.
export function useCurrentOdontogram(patientId: string) {
  return useQuery({
    queryKey: ["emr", "odontogram", patientId],
    queryFn: () => emrService.getCurrentOdontogram(patientId),
    enabled: Boolean(patientId),
  });
}

// docs/06-tasks/task-070.md.
export function useToothHistory(patientId: string, toothNumber: number | null) {
  return useQuery({
    queryKey: ["emr", "odontogram", patientId, "history", toothNumber],
    queryFn: () => emrService.getToothHistory(patientId, toothNumber as number),
    enabled: Boolean(patientId) && toothNumber !== null,
  });
}

// docs/06-tasks/task-068.md.
export function useRecordToothCondition(visitId: string, patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordToothConditionInput) => emrService.recordToothCondition(visitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "odontogram", patientId] }),
  });
}
