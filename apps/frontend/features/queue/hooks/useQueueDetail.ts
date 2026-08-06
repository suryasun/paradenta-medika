import { useQuery } from "@tanstack/react-query";
import { queueService } from "../services/queue.service";

// docs/06-tasks/task-314.md: feeds the Queue Detail modal with the freshest
// single-record view (GET /queues/:id) rather than relying only on the
// board's already-fetched list snapshot.
export function useQueueDetail(id: string | null) {
  return useQuery({
    queryKey: ["queues", "detail", id],
    queryFn: () => queueService.detail(id as string),
    enabled: id !== null,
  });
}
