import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { CreateQueueInput, ListQueueParams, QueueDashboard, QueueEntry } from "../types/queue.types";

// docs/06-tasks/task-037.md..task-047.md
export const queueService = {
  async list(params: ListQueueParams): Promise<{ items: QueueEntry[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<QueueEntry[]>>("/queues", { params });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async detail(id: string): Promise<QueueEntry> {
    const response = await apiClient.get<ApiSuccessBody<QueueEntry>>(`/queues/${id}`);
    return response.data.data;
  },

  async create(payload: CreateQueueInput): Promise<QueueEntry> {
    const response = await apiClient.post<ApiSuccessBody<QueueEntry>>("/queues", payload);
    return response.data.data;
  },

  async call(id: string): Promise<QueueEntry> {
    const response = await apiClient.patch<ApiSuccessBody<QueueEntry>>(`/queues/${id}/call`);
    return response.data.data;
  },

  async recall(id: string): Promise<QueueEntry> {
    const response = await apiClient.patch<ApiSuccessBody<QueueEntry>>(`/queues/${id}/recall`);
    return response.data.data;
  },

  async skip(id: string, reason?: string): Promise<QueueEntry> {
    const response = await apiClient.patch<ApiSuccessBody<QueueEntry>>(`/queues/${id}/skip`, { reason });
    return response.data.data;
  },

  async start(id: string): Promise<QueueEntry> {
    const response = await apiClient.patch<ApiSuccessBody<QueueEntry>>(`/queues/${id}/start`);
    return response.data.data;
  },

  async complete(id: string): Promise<QueueEntry> {
    const response = await apiClient.patch<ApiSuccessBody<QueueEntry>>(`/queues/${id}/complete`);
    return response.data.data;
  },

  async cancel(id: string, reason?: string): Promise<QueueEntry> {
    const response = await apiClient.patch<ApiSuccessBody<QueueEntry>>(`/queues/${id}/cancel`, { reason });
    return response.data.data;
  },

  async transfer(id: string, doctorId: string, reason: string): Promise<QueueEntry> {
    const response = await apiClient.patch<ApiSuccessBody<QueueEntry>>(`/queues/${id}/transfer`, { doctorId, reason });
    return response.data.data;
  },

  async dashboard(params: { branchId?: string; date?: string }): Promise<QueueDashboard> {
    const response = await apiClient.get<ApiSuccessBody<QueueDashboard>>("/queues/dashboard", { params });
    return response.data.data;
  },
};
