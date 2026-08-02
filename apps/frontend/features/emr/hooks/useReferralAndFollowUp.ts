import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { CreateFollowUpInput, CreateReferralInput } from "../types/emr.types";

// docs/06-tasks/task-089.md.
export function useReferrals(visitId: string) {
  return useQuery({
    queryKey: ["emr", "referrals", visitId],
    queryFn: () => emrService.getReferrals(visitId),
    enabled: Boolean(visitId),
  });
}

export function useCreateReferral(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReferralInput) => emrService.createReferral(visitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "referrals", visitId] }),
  });
}

// docs/06-tasks/task-090.md.
export function useFollowUps(visitId: string) {
  return useQuery({
    queryKey: ["emr", "follow-ups", visitId],
    queryFn: () => emrService.getFollowUps(visitId),
    enabled: Boolean(visitId),
  });
}

export function useCreateFollowUp(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFollowUpInput) => emrService.createFollowUp(visitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "follow-ups", visitId] }),
  });
}
