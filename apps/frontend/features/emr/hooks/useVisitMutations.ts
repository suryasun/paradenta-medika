import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { DiagnosisEntryInput, RecordTreatmentInput, RecordVitalSignInput, SoapNoteInput, UpdateTreatmentInput } from "../types/emr.types";

function invalidateVisit(queryClient: ReturnType<typeof useQueryClient>, visitId: string) {
  queryClient.invalidateQueries({ queryKey: ["emr", "visit", visitId] });
}

export function useRecordVitalSign(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordVitalSignInput) => emrService.recordVitalSign(visitId, payload),
    onSuccess: () => invalidateVisit(queryClient, visitId),
  });
}

export function useSaveSoapNote(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SoapNoteInput) => emrService.saveSoapNote(visitId, payload),
    onSuccess: () => invalidateVisit(queryClient, visitId),
  });
}

export function useRecordDiagnoses(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (diagnoses: DiagnosisEntryInput[]) => emrService.recordDiagnoses(visitId, diagnoses),
    onSuccess: () => invalidateVisit(queryClient, visitId),
  });
}

export function useRecordTreatment(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordTreatmentInput) => emrService.recordTreatment(visitId, payload),
    onSuccess: () => invalidateVisit(queryClient, visitId),
  });
}

// docs/06-tasks/task-321.md
export function useUpdateTreatment(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ treatmentEntryId, payload }: { treatmentEntryId: string; payload: UpdateTreatmentInput }) =>
      emrService.updateTreatment(visitId, treatmentEntryId, payload),
    onSuccess: () => invalidateVisit(queryClient, visitId),
  });
}

export function useRemoveTreatment(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (treatmentEntryId: string) => emrService.removeTreatment(visitId, treatmentEntryId),
    onSuccess: () => invalidateVisit(queryClient, visitId),
  });
}

export function useCloseVisit(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => emrService.closeVisit(visitId),
    onSuccess: () => invalidateVisit(queryClient, visitId),
  });
}
