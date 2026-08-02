import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { SaveMeasurementInput, UpdateMeasurementInput } from "../types/emr.types";

// docs/06-tasks/task-071.md..task-077.md.
export function usePeriodontalAssessment(assessmentId: string | null) {
  return useQuery({
    queryKey: ["emr", "periodontal-assessment", assessmentId],
    queryFn: () => emrService.getPeriodontalAssessment(assessmentId as string),
    enabled: assessmentId !== null,
  });
}

export function usePeriodontalAssessmentHistory(assessmentId: string | null) {
  return useQuery({
    queryKey: ["emr", "periodontal-assessment", assessmentId, "history"],
    queryFn: () => emrService.getPeriodontalAssessmentHistory(assessmentId as string),
    enabled: assessmentId !== null,
  });
}

export function useCreatePeriodontalAssessment() {
  return useMutation({
    mutationFn: ({ visitId, patientId, doctorId }: { visitId: string; patientId: string; doctorId: string }) =>
      emrService.createPeriodontalAssessment(visitId, patientId, doctorId),
  });
}

export function useLockPeriodontalAssessment(assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => emrService.lockPeriodontalAssessment(assessmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "periodontal-assessment", assessmentId] }),
  });
}

export function useAddPeriodontalMeasurement(assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveMeasurementInput) => emrService.addPeriodontalMeasurement(assessmentId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "periodontal-assessment", assessmentId] }),
  });
}

export function useUpdatePeriodontalMeasurement(assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMeasurementInput }) =>
      emrService.updatePeriodontalMeasurement(assessmentId, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "periodontal-assessment", assessmentId] }),
  });
}

export function useDeletePeriodontalMeasurement(assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emrService.deletePeriodontalMeasurement(assessmentId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "periodontal-assessment", assessmentId] }),
  });
}
