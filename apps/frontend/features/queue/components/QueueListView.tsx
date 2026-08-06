"use client";

import Link from "next/link";
import { DragEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/utils/cn";
import { useQueues } from "../hooks/useQueues";
import { useCallQueue, useCompleteQueue, useStartQueueService } from "../hooks/useQueueMutations";
import { isValidDragTransition, QUEUE_STATUS_TONE } from "../lib/status";
import { AddToQueueModal } from "./AddToQueueModal";
import { QueueCard } from "./QueueCard";
import { QueueEntry } from "../types/queue.types";

export { QUEUE_STATUS_TONE };

const BOARD_COLUMNS: QueueEntry["status"][] = ["WAITING", "CALLED", "IN_SERVICE", "COMPLETED"];

// docs/06-tasks/task-315.md: client-side "today" default, mirroring
// Reservation List's identical todayIso() pattern. Unlike Reservation
// (which also bounds the input with `min={todayIso()}` to split List from
// History), Queue has no separate history view and staff may legitimately
// need to look at past dates for reconciliation -- only the default value
// changes here, the filter itself stays freely editable to any date.
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// docs/02-design/Parakita - Key Screens.dc.html "isQueue": a 4-column
// Kanban board (Waiting/Called/In Service/Completed), fetched without
// pagination since a day's board is meant to be seen at a glance.
// Cancelled/No-Show/Skipped are not board columns in the mockup either;
// selecting one of those from the status filter switches to a flat grid
// instead of the board, since the mockup describes those as a "Queue
// History" concern (per docs/02-design/pages/queue.md), not the live board.
//
// docs/02-design/design-system.md §11.2: board columns are drop targets
// for QueueCard's drag source. A drop only commits (dashed-border
// highlight while hovering) when it matches a valid forward transition
// (../lib/status.ts) -- an invalid target never highlights and never
// accepts the drop, so an invalid transition is prevented client-side
// rather than attempted and rejected server-side.
export function QueueListView() {
  const [status, setStatus] = useState("");
  const [visitDate, setVisitDate] = useState(todayIso());
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedEntry, setDraggedEntry] = useState<QueueEntry | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<QueueEntry["status"] | null>(null);
  const { data, isLoading, isError, error, refetch } = useQueues({ status: status || undefined, visitDate: visitDate || undefined, limit: 100 });

  const callQueue = useCallQueue();
  const startService = useStartQueueService();
  const completeQueue = useCompleteQueue();

  const items = data?.items ?? [];
  const isBoardView = !status;

  function handleDragOver(event: DragEvent<HTMLDivElement>, column: QueueEntry["status"]) {
    if (draggedEntry && isValidDragTransition(draggedEntry.status, column)) {
      event.preventDefault();
      setDragOverColumn(column);
    }
  }

  function handleDrop(column: QueueEntry["status"]) {
    setDragOverColumn(null);
    if (!draggedEntry || !isValidDragTransition(draggedEntry.status, column)) return;
    if (column === "CALLED") callQueue.mutate(draggedEntry.id);
    else if (column === "IN_SERVICE") startService.mutate(draggedEntry.id);
    else if (column === "COMPLETED") completeQueue.mutate(draggedEntry.id);
    setDraggedEntry(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-foreground">Queue</h1>
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

      {isBoardView && items.length > 0 && (
        <p className="text-xs text-muted">Drag a ticket to the next column, or use its action buttons — both do the same thing.</p>
      )}

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

      {isLoading && <LoadingState label="Loading queue..." cards={4} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState title="Queue is empty" description="No entries match your current filters." />
      )}

      {!isLoading && !isError && items.length > 0 && isBoardView && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BOARD_COLUMNS.map((column) => {
            const columnItems = items.filter((item) => item.status === column);
            return (
              <div
                key={column}
                data-testid={`queue-column-${column}`}
                onDragOver={(e) => handleDragOver(e, column)}
                onDragLeave={() => setDragOverColumn((c) => (c === column ? null : c))}
                onDrop={() => handleDrop(column)}
                className={cn(
                  "rounded-lg border-2 border-dashed p-1.5 transition-colors duration-[180ms]",
                  dragOverColumn === column ? "border-primary bg-[var(--color-primary-100)]" : "border-transparent",
                )}
              >
                <div className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wide text-muted">
                  {column.replace("_", " ")} ({columnItems.length})
                </div>
                <div className="flex flex-col gap-2.5">
                  {columnItems.map((queue) => (
                    <QueueCard
                      key={queue.id}
                      queue={queue}
                      onDragStart={setDraggedEntry}
                      onDragEnd={() => {
                        setDraggedEntry(null);
                        setDragOverColumn(null);
                      }}
                    />
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
