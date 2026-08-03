"use client";

import { DragEvent, useState } from "react";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useOpenVisit } from "@/features/emr/hooks/useOpenVisit";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  useCallQueue,
  useCancelQueue,
  useCompleteQueue,
  useRecallQueue,
  useSkipQueue,
  useStartQueueService,
} from "../hooks/useQueueMutations";
import { QUEUE_STATUS_TONE } from "../lib/status";
import { QueueEntry } from "../types/queue.types";
import { QueueReasonModal } from "./QueueReasonModal";
import { TransferQueueModal } from "./TransferQueueModal";

const STATUS_ACCENT: Record<QueueEntry["status"], string> = {
  WAITING: "var(--color-warning-500)",
  CALLED: "var(--color-info-500)",
  IN_SERVICE: "var(--color-primary-600)",
  COMPLETED: "var(--color-success-500)",
  CANCELLED: "var(--color-error-500)",
  NO_SHOW: "var(--color-error-500)",
  SKIPPED: "var(--color-secondary-400)",
};

// docs/02-design/Parakita - Key Screens.dc.html "isQueue" board: a ticket
// card with a left accent border colored by status. apps/backend's
// QueueResponseDto only carries patientId/doctorId (no denormalized
// name); doctor name is resolved client-side via Master Data's own
// already-fetched Doctor list (same join pattern reservation.md's list
// view uses) -- patient name has no equivalent cheap bulk lookup and
// stays a flagged, out-of-scope backend gap (queue.md §2.1).
//
// docs/02-design/design-system.md §11.2: the card is draggable between
// board columns as an *accelerator* -- every existing button action below
// (Call/Recall/Start/.../Transfer) is untouched and remains the full
// non-drag equivalent, per ui-guidelines.md §9.4.
export function QueueCard({
  queue,
  onDragStart,
  onDragEnd,
}: {
  queue: QueueEntry;
  onDragStart?: (queue: QueueEntry) => void;
  onDragEnd?: () => void;
}) {
  const [modal, setModal] = useState<"skip" | "cancel" | "transfer" | null>(null);
  const callQueue = useCallQueue();
  const recallQueue = useRecallQueue();
  const startService = useStartQueueService();
  const completeQueue = useCompleteQueue();
  const skipQueue = useSkipQueue();
  const cancelQueue = useCancelQueue();
  const openVisit = useOpenVisit();
  const { data: doctorsData } = useDoctors();
  const doctorName = doctorsData?.items.find((d) => d.id === queue.doctorId)?.fullName;

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/plain", queue.id);
    event.dataTransfer.effectAllowed = "move";
    onDragStart?.(queue);
  }

  return (
    <div
      role="group"
      aria-label={queue.queueNumber}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className="cursor-grab rounded-md border border-border bg-surface p-3.5 transition-[transform,box-shadow] duration-[100ms] ease-out hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
      style={{ borderLeft: `3px solid ${STATUS_ACCENT[queue.status]}` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-bold text-foreground">
          <GripVertical size={13} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden="true" />
          {queue.queueNumber}
        </span>
        <span className="font-tabular text-[11px] font-medium text-muted">
          {new Date(queue.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="mt-1.5">
        <Badge tone={QUEUE_STATUS_TONE[queue.status]}>{queue.status.replace("_", " ")}</Badge>
      </div>
      {doctorName && <div className="mt-1.5 text-[13px] text-foreground">{doctorName}</div>}
      <div className="mt-0.5 text-[13px] text-muted">{queue.queueType}</div>
      <div className="mt-0.5 text-[11px] text-muted">{queue.priority}</div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {(queue.status === "WAITING" || queue.status === "SKIPPED") && (
          <PermissionGuard permission="queue.call">
            <Button variant="tertiary" isLoading={callQueue.isPending} onClick={() => callQueue.mutate(queue.id)}>
              Call
            </Button>
          </PermissionGuard>
        )}
        {queue.status === "CALLED" && (
          <>
            <PermissionGuard permission="queue.recall">
              <Button variant="tertiary" isLoading={recallQueue.isPending} onClick={() => recallQueue.mutate(queue.id)}>
                Recall
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="queue.start">
              <Button isLoading={startService.isPending} onClick={() => startService.mutate(queue.id)}>
                Start
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="emr.visit.create">
              <Button variant="tertiary" isLoading={openVisit.isPending} onClick={() => openVisit.mutate(queue.id)}>
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
            <Button variant="tertiary" onClick={() => setModal("skip")}>
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
            <Button variant="tertiary" onClick={() => setModal("transfer")}>
              Transfer
            </Button>
          </PermissionGuard>
        )}
      </div>

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
    </div>
  );
}
