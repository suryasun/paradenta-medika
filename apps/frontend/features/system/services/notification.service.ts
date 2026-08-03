import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { Notification, NotificationChannel, NotificationTemplate, TemplatePreviewResult } from "../types/system.types";

export const notificationTemplateService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: NotificationTemplate[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<NotificationTemplate[]>>("/system/notification-templates", { params: { limit: 50, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  async create(payload: {
    templateKey: string;
    channel: NotificationChannel;
    locale: string;
    subject?: string;
    body: string;
    variableSchema: string[];
    classification?: string;
  }): Promise<NotificationTemplate> {
    const response = await apiClient.post<ApiSuccessBody<NotificationTemplate>>("/system/notification-templates", payload);
    return response.data.data;
  },
  async preview(templateId: string, payload?: Record<string, unknown>): Promise<TemplatePreviewResult> {
    const response = await apiClient.post<ApiSuccessBody<TemplatePreviewResult>>(`/system/notification-templates/${templateId}/preview`, { payload });
    return response.data.data;
  },
};

export const notificationService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: Notification[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Notification[]>>("/system/notifications", { params: { limit: 50, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  async markRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.post<ApiSuccessBody<Notification>>(`/system/notifications/${notificationId}/read`);
    return response.data.data;
  },
};
