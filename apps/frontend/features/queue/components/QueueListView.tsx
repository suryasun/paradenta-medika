"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useQueues } from "../hooks/useQueues";
import { AddToQueueModal } from "./AddToQueueModal";
import { QueueCard } from "./QueueCard";
import { QueueEntry } from "../types/queue.types";

export const QUEUE_STATUS_TONE: Record<QueueEntry["status"], "neutral" | "success" | "warning" | "error" | "info"> = {
  WAITING: "info",
  CALLED: "warning",
  IN_SERVICE: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "error",
  SKIPPED: "neutral",
};

const BOARD_COLUMNS: QueueEntry["status"][] = ["WAITING", "CALLED", "IN_SERVICE", "COMPLETED"];

// docs/02-design/Parakita - Key Screens.dc.html "isQueue": a 4-column
// Kanban board (Waiting/Called/In Service/Completed), fetched without
// pagination since a day's board is meant to be seen at a glance.
// Cancelled/No-Show/Skipped are not board columns in the mockup either;
// selecting one of those from the status filter switches to a flat grid
// instead of the board, since the mockup describes those as a "Queue
// History" concern (per docs/02-design/pages/queue.md), not the live board.
export function QueueListView() {
  const [status, setStatus] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQueues({ status: status || undefined, visitDate: visitDate || undefined, limit: 100 });

  const items = data?.items ?? [];
  const isBoardView = !status;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Queue</h1>
        <div className="flex gap-2">
          <PermissionGuard permission="queue.dashboard.read">
            <Link href="/queue/dashboard">
              <Button variant="secondary">Dashboard</Button>
            </Link>
          </PermissionGuard>
          <PermissionGuard permission="queue.create">
            <Button onClick={() => setShowAddModal(true)}>Add Walk-in</Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Board (Waiting / Called / In Service / Completed)</option>
          {Object.keys(QUEUE_STATUS_TONE).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
      </div>

      {isLoading && <LoadingState label="Loading queue..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState title="Queue is empty" description="No entries match your current filters." />
      )}

      {!isLoading && !isError && items.length > 0 && isBoardView && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BOARD_COLUMNS.map((column) => {
            const columnItems = items.filter((item) => item.status === column);
            return (
              <div key={column}>
                <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">
                  {column.replace("_", " ")} ({columnItems.length})
                </div>
                <div className="flex flex-col gap-2.5">
                  {columnItems.map((queue) => (
                    <QueueCard key={queue.id} queue={queue} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && !isBoardView && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((queue) => (
            <QueueCard key={queue.id} queue={queue} />
          ))}
        </div>
      )}

      {showAddModal && <AddToQueueModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
