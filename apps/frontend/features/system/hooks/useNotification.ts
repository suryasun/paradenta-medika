import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService, notificationTemplateService } from "../services/notification.service";
import { NotificationChannel } from "../types/system.types";

export function useNotifications(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "notifications", "list", params], queryFn: () => notificationService.list(params) });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "notifications"] }),
  });
}

export function useNotificationTemplates(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "notification-templates", "list", params], queryFn: () => notificationTemplateService.list(params) });
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      templateKey: string;
      channel: NotificationChannel;
      locale: string;
      subject?: string;
      body: string;
      variableSchema: string[];
      classification?: string;
    }) => notificationTemplateService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "notification-templates"] }),
  });
}

export function usePreviewNotificationTemplate() {
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload?: Record<string, unknown> }) =>
      notificationTemplateService.preview(templateId, payload),
  });
}
