import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backgroundJobService } from "../services/backgroundJob.service";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["system", "jobs", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["system", "jobs", "detail", id] });
}

export function useBackgroundJobs(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "jobs", "list", params], queryFn: () => backgroundJobService.list(params) });
}

export function useBackgroundJob(id: string) {
  return useQuery({ queryKey: ["system", "jobs", "detail", id], queryFn: () => backgroundJobService.detail(id), enabled: !!id });
}

export function useRetryBackgroundJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => backgroundJobService.retry(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useCancelBackgroundJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => backgroundJobService.cancel(id), onSuccess: () => invalidate(queryClient, id) });
}
