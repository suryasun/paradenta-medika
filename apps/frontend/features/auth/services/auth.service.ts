import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { LoginRequest, LoginResponse } from "../types/auth.types";

// docs/06-tasks/task-007.md (POST /auth/login), task-009.md (POST /auth/logout).
export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiSuccessBody<LoginResponse>>("/auth/login", payload);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};
