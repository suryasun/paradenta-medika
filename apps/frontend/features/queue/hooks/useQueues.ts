import { useQuery } from "@tanstack/react-query";
import { queueService } from "../services/queue.service";
import { ListQueueParams } from "../types/queue.types";

export function useQueues(params: ListQueueParams) {
  return useQuery({
    queryKey: ["queues", "list", params],
    queryFn: () => queueService.list(params),
    placeholderData: (previous) => previous,
    // Front-desk/nurse call board: keep the list fresh without manual
    // refresh, same operational intent as the Queue Dashboard's live feel.
    refetchInterval: 15_000,
  });
}
