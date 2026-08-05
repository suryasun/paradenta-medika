import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { ReferralSource } from "../types/masterData.types";

// task-287 (Epic PE4). No pagination meta -- apps/backend's
// ReferralSourceController returns a plain array (a small fixed catalog).
export const referralSourceService = {
  async list(): Promise<ReferralSource[]> {
    const response = await apiClient.get<ApiSuccessBody<ReferralSource[]>>("/master-data/referral-sources");
    return response.data.data;
  },
};
