import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { ConvertTreatmentPlanToReservationInput, TreatmentPlanItemEntryInput } from "../types/emr.types";

// docs/06-tasks/task-063.md: Visit-scoped, distinct from the Patient-scoped
// Medical History/Allergy/Odontogram queries.
export function useTreatmentPlan(visitId: string) {
  return useQuery({
    queryKey: ["emr", "treatment-plan", visitId],
    queryFn: () => emrService.getTreatmentPlan(visitId),
    enabled: Boolean(visitId),
  });
}

export function useCreateTreatmentPlan(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: TreatmentPlanItemEntryInput[]) => emrService.createTreatmentPlan(visitId, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "treatment-plan", visitId] }),
  });
}

// docs/06-tasks/task-064.md.
export function useConvertTreatmentPlanToReservation(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: ConvertTreatmentPlanToReservationInput }) =>
      emrService.convertTreatmentPlanItemToReservation(itemId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "treatment-plan", visitId] }),
  });
}
