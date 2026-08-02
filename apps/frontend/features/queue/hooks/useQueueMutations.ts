import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queueService } from "../services/queue.service";
import { CreateQueueInput } from "../types/queue.types";

function invalidateQueues(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["queues"] });
}

export function useCreateQueueEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQueueInput) => queueService.create(payload),
    onSuccess: () => invalidateQueues(queryClient),
  });
}

export function useCallQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.call(id),
    onSuccess: () => invalidateQueues(queryClient),
  });
}

export function useRecallQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.recall(id),
    onSuccess: () => invalidateQueues(queryClient),
  });
}

export function useSkipQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => queueService.skip(id, reason),
    onSuccess: () => invalidateQueues(queryClient),
  });
}

export function useStartQueueService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.start(id),
    onSuccess: () => invalidateQueues(queryClient),
  });
}

export function useCompleteQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queueService.complete(id),
    onSuccess: () => invalidateQueues(queryClient),
  });
}

export function useCancelQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => queueService.cancel(id, reason),
    onSuccess: () => invalidateQueues(queryClient),
  });
}

export function useTransferQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, doctorId, reason }: { id: string; doctorId: string; reason: string }) => queueService.transfer(id, doctorId, reason),
    onSuccess: () => invalidateQueues(queryClient),
  });
}
