"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { useOpenVisit } from "@/features/emr/hooks/useOpenVisit";
import { useQueues } from "../hooks/useQueues";
import {
  useCallQueue,
  useCancelQueue,
  useCompleteQueue,
  useRecallQueue,
  useSkipQueue,
  useStartQueueService,
} from "../hooks/useQueueMutations";
import { AddToQueueModal } from "./AddToQueueModal";
import { QueueReasonModal } from "./QueueReasonModal";
import { TransferQueueModal } from "./TransferQueueModal";
import { getApiErrorMessage } from "@/lib/api-client";
import { ListQueueParams, QueueEntry } from "../types/queue.types";

// docs/06-tasks/task-037.md..task-046.md. Per-status action visibility
// mirrors apps/backend's queueTransitions.ts allowed-from table exactly
// (WAITING: Call/Skip/Cancel/Transfer; CALLED: Start/Recall/Transfer;
// SKIPPED: Call/Transfer; IN_SERVICE: Complete only) so staff never see a
// button that would 422.
export const QUEUE_STATUS_TONE: Record<QueueEntry["status"], "neutral" | "success" | "warning" | "error" | "info"> = {
  WAITING: "info",
  CALLED: "warning",
  IN_SERVICE: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "error",
  SKIPPED: "neutral",
};

function QueueRow({ queue }: { queue: QueueEntry }) {
  const [modal, setModal] = useState<"skip" | "cancel" | "transfer" | null>(null);
  const callQueue = useCallQueue();
  const recallQueue = useRecallQueue();
  const startService = useStartQueueService();
  const completeQueue = useCompleteQueue();
  const skipQueue = useSkipQueue();
  const cancelQueue = useCancelQueue();
  const openVisit = useOpenVisit();

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{queue.queueNumber}</TableCell>
        <TableCell>{queue.queueType}</TableCell>
        <TableCell>{queue.priority}</TableCell>
        <TableCell>
          <Badge tone={QUEUE_STATUS_TONE[queue.status]}>{queue.status}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            {queue.status === "WAITING" && (
              <PermissionGuard permission="queue.call">
                <Button variant="secondary" isLoading={callQueue.isPending} onClick={() => callQueue.mutate(queue.id)}>
                  Call
                </Button>
              </PermissionGuard>
            )}
            {queue.status === "SKIPPED" && (
              <PermissionGuard permission="queue.call">
                <Button variant="secondary" isLoading={callQueue.isPending} onClick={() => callQueue.mutate(queue.id)}>
                  Call
                </Button>
              </PermissionGuard>
            )}
            {queue.status === "CALLED" && (
              <>
                <PermissionGuard permission="queue.recall">
                  <Button variant="secondary" isLoading={recallQueue.isPending} onClick={() => recallQueue.mutate(queue.id)}>
                    Recall
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="queue.start">
                  <Button isLoading={startService.isPending} onClick={() => startService.mutate(queue.id)}>
                    Start
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="emr.visit.create">
                  <Button variant="secondary" isLoading={openVisit.isPending} onClick={() => openVisit.mutate(queue.id)}>
                    Open Visit
                  </Button>
                </PermissionGuard>
              </>
            )}
            {queue.status === "IN_SERVICE" && (
              <PermissionGuard permission="queue.complete">
                <Button isLoading={completeQueue.isPending} onClick={() => completeQueue.mutate(queue.id)}>
                  Complete
                </Button>
              </PermissionGuard>
            )}
            {queue.status === "WAITING" && (
              <PermissionGuard permission="queue.skip">
                <Button variant="secondary" onClick={() => setModal("skip")}>
                  Skip
                </Button>
              </PermissionGuard>
            )}
            {queue.status === "WAITING" && (
              <PermissionGuard permission="queue.cancel">
                <Button variant="danger" onClick={() => setModal("cancel")}>
                  Cancel
                </Button>
              </PermissionGuard>
            )}
            {["WAITING", "CALLED", "SKIPPED"].includes(queue.status) && (
              <PermissionGuard permission="queue.transfer">
                <Button variant="secondary" onClick={() => setModal("transfer")}>
                  Transfer
                </Button>
              </PermissionGuard>
            )}
          </div>
        </TableCell>
      </TableRow>
      {modal === "skip" && (
        <QueueReasonModal
          title="Skip Queue Entry"
          submitLabel="Confirm Skip"
          isSubmitting={skipQueue.isPending}
          submitError={skipQueue.isError ? getApiErrorMessage(skipQueue.error) : undefined}
          onClose={() => setModal(null)}
          onSubmit={(reason) => skipQueue.mutate({ id: queue.id, reason }, { onSuccess: () => setModal(null) })}
        />
      )}
      {modal === "cancel" && (
        <QueueReasonModal
          title="Cancel Queue Entry"
          submitLabel="Confirm Cancel"
          isSubmitting={cancelQueue.isPending}
          submitError={cancelQueue.isError ? getApiErrorMessage(cancelQueue.error) : undefined}
          onClose={() => setModal(null)}
          onSubmit={(reason) => cancelQueue.mutate({ id: queue.id, reason }, { onSuccess: () => setModal(null) })}
        />
      )}
      {modal === "transfer" && <TransferQueueModal queueId={queue.id} currentDoctorId={queue.doctorId} onClose={() => setModal(null)} />}
    </>
  );
}

export function QueueListView() {
  const [filters, setFilters] = useState<ListQueueParams>({ page: 1, limit: 20 });
  const [showAddModal, setShowAddModal] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQueues(filters);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Queue</h1>
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
        <Select value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}>
          <option value="">All statuses</option>
          {Object.keys(QUEUE_STATUS_TONE).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={filters.visitDate ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, visitDate: e.target.value || undefined, page: 1 }))}
        />
      </div>

      {isLoading && <LoadingState label="Loading queue..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState title="Queue is empty" description="No entries match your current filters." />
      )}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Number</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((queue) => (
              <QueueRow key={queue.id} queue={queue} />
            ))}
          </TableBody>
        </Table>
      )}
      {data && <Pagination meta={data.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />}

      {showAddModal && <AddToQueueModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
