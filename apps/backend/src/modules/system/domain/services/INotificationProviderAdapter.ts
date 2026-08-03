import { NotificationChannel } from '@prisma/client';

export interface NotificationDeliveryRequest {
  channel: NotificationChannel;
  recipientUserId: string;
  subject?: string;
  message: string;
}

export interface NotificationDeliveryResult {
  success: boolean;
  errorSafeMessage?: string;
}

/**
 * docs/03-sad/21-module-system.md UC-SYS-005 step 4: "Worker sends
 * through provider adapter." No real email/SMS/push gateway is an
 * approved dependency in this codebase yet -- the interface exists so a
 * real adapter can be swapped in later without touching
 * SendNotificationUseCase.
 */
export interface INotificationProviderAdapter {
  send(request: NotificationDeliveryRequest): Promise<NotificationDeliveryResult>;
}
