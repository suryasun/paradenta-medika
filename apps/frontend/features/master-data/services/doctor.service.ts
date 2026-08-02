import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { Doctor } from "../types/masterData.types";

// docs/06-tasks/task-023.md: GET /doctors. Read-only lookup for
// Reservation/Queue pickers -- not the full Doctor admin CRUD feature.
export const doctorService = {
  async list(params: { search?: string; limit?: number } = {}): Promise<{ items: Doctor[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Doctor[]>>("/doctors", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
};
