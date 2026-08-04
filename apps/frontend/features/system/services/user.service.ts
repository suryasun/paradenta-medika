import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { BranchAssignmentEntry, CreateUserInput, ListUsersParams, SystemUser, UserBranch } from "../types/system.types";

// docs/06-tasks/task-015.md, task-016.md, task-019.md, task-020.md
export const userService = {
  async list(params: ListUsersParams): Promise<{ items: SystemUser[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<SystemUser[]>>("/system/users", { params });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async detail(userId: string): Promise<SystemUser> {
    const response = await apiClient.get<ApiSuccessBody<SystemUser>>(`/system/users/${userId}`);
    return response.data.data;
  },

  async create(payload: CreateUserInput): Promise<SystemUser> {
    const response = await apiClient.post<ApiSuccessBody<SystemUser>>("/system/users", payload);
    return response.data.data;
  },

  async updateEmail(userId: string, email: string): Promise<SystemUser> {
    const response = await apiClient.patch<ApiSuccessBody<SystemUser>>(`/system/users/${userId}`, { email });
    return response.data.data;
  },

  async activate(userId: string): Promise<SystemUser> {
    const response = await apiClient.post<ApiSuccessBody<SystemUser>>(`/system/users/${userId}/activate`);
    return response.data.data;
  },

  async deactivate(userId: string): Promise<SystemUser> {
    const response = await apiClient.post<ApiSuccessBody<SystemUser>>(`/system/users/${userId}/deactivate`);
    return response.data.data;
  },

  async assignRoles(userId: string, roleIds: string[], reason?: string): Promise<void> {
    await apiClient.post(`/system/users/${userId}/roles`, { roleIds, reason });
  },

  async revokeSessions(userId: string, sessionId?: string): Promise<void> {
    await apiClient.post(`/system/users/${userId}/revoke-sessions`, { sessionId });
  },

  // Phase 4, task-210/211 (docs/06-tasks/phase-4-documentation/epic-ba-branch-assignment.md).
  async listBranches(userId: string): Promise<UserBranch[]> {
    const response = await apiClient.get<ApiSuccessBody<UserBranch[]>>(`/system/users/${userId}/branches`);
    return response.data.data;
  },

  // Replaces the user's full branch-assignment set (not additive).
  async assignBranches(userId: string, branchAssignments: BranchAssignmentEntry[]): Promise<UserBranch[]> {
    const response = await apiClient.post<ApiSuccessBody<UserBranch[]>>(`/system/users/${userId}/branches`, { branchAssignments });
    return response.data.data;
  },
};
