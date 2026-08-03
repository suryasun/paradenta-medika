import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dailyClosingService } from "../services/finance.service";

export function useDailyClosings(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "daily-closings", "list", params], queryFn: () => dailyClosingService.list(params) });
}

export function useCreateDailyClosing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dailyClosingService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finance", "daily-closings"] }),
  });
}

export function useApproveDailyClosing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyClosingService.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finance", "daily-closings"] }),
  });
}
