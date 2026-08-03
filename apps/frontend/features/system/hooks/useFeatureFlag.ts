import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { featureFlagService } from "../services/featureFlag.service";

export function useFeatureFlags(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "feature-flags", "list", params], queryFn: () => featureFlagService.list(params) });
}

export function useCreateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: featureFlagService.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "feature-flags"] }) });
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flagKey, payload }: { flagKey: string; payload: Record<string, unknown> }) => featureFlagService.update(flagKey, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "feature-flags"] }),
  });
}
