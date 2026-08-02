import { useQuery } from "@tanstack/react-query";
import { queueService } from "../services/queue.service";

export function useQueueDashboard(params: { branchId?: string; date?: string }) {
  return useQuery({
    queryKey: ["queues", "dashboard", params],
    queryFn: () => queueService.dashboard(params),
    refetchInterval: 15_000,
  });
}
