import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { createCrudService } from "../lib/createCrudService";
import { Doctor } from "../types/masterData.types";

const crud = createCrudService<Doctor>("/doctors");

// docs/06-tasks/task-023.md. `list` keeps its narrower {search,limit}
// signature since Reservation/Queue/EMR pickers already call it that way;
// create/update come from the shared factory for the admin CRUD screen.
export const doctorService = {
  async list(params: { search?: string; limit?: number } = {}): Promise<{ items: Doctor[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Doctor[]>>("/doctors", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  create: crud.create,
  update: crud.update,
};
