import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { District, Province, Regency, Village } from "../types/masterData.types";

// task-285 (Epic PE2). No pagination meta -- apps/backend's RegionController
// returns a plain array (these lists are always parent-filtered to a small
// subtree size), unlike the paginated Master Data catalogs.
export const regionService = {
  async listProvinces(): Promise<Province[]> {
    const response = await apiClient.get<ApiSuccessBody<Province[]>>("/master-data/provinces");
    return response.data.data;
  },
  async listRegencies(provinceId?: string): Promise<Regency[]> {
    const response = await apiClient.get<ApiSuccessBody<Regency[]>>("/master-data/regencies", { params: { provinceId } });
    return response.data.data;
  },
  async listDistricts(regencyId?: string): Promise<District[]> {
    const response = await apiClient.get<ApiSuccessBody<District[]>>("/master-data/districts", { params: { regencyId } });
    return response.data.data;
  },
  async listVillages(districtId?: string): Promise<Village[]> {
    const response = await apiClient.get<ApiSuccessBody<Village[]>>("/master-data/villages", { params: { districtId } });
    return response.data.data;
  },
};
