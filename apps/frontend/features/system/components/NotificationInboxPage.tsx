"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useMarkNotificationRead, useNotifications } from "../hooks/useNotification";
import { NotificationStatus } from "../types/system.types";

const STATUS_TONE: Record<NotificationStatus, "neutral" | "warning" | "success" | "error" | "info"> = {
  QUEUED: "neutral",
  PROCESSING: "info",
  SENT: "info",
  DELIVERED: "success",
  FAILED: "error",
  READ: "neutral",
  CANCELLED: "neutral",
};

// GET /system/notifications is scoped server-side to the caller's own
// userId (not client-settable) -- this is always "my inbox", never a
// cross-user admin view.
export function NotificationInboxPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  if (isLoading) return <LoadingState label="Loading notifications..." rows={5} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const notifications = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Notifications</h1>
      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Message</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>{new Date(notification.createdAt).toLocaleString()}</TableCell>
                <TableCell>{notification.subject ?? "-"}</TableCell>
                <TableCell className="max-w-md truncate">{notification.message}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[notification.status]}>{notification.status}</Badge>
                </TableCell>
                <TableCell>
                  {notification.status !== "READ" && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      <Check size={13} strokeWidth={1.75} aria-hidden="true" />
                      Mark Read
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {markRead.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(markRead.error)}
        </p>
      )}
    </div>
  );
}
