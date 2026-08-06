"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useOpenVisit } from "@/features/emr/hooks/useOpenVisit";
import { getApiErrorMessage } from "@/lib/api-client";
import { useQueueDetail } from "../hooks/useQueueDetail";
import {
  useCallQueue,
  useCancelQueue,
  useCompleteQueue,
  useRecallQueue,
  useSkipQueue,
  useStartQueueService,
} from "../hooks/useQueueMutations";
import { QUEUE_STATUS_TONE } from "../lib/status";
import { QueueReasonModal } from "./QueueReasonModal";
import { TransferQueueModal } from "./TransferQueueModal";

// docs/06-tasks/task-314.md: single detail surface for a Queue entry,
// consolidating every action (Start/Call/Recall/Skip/Cancel/Transfer/Open
// Visit) that today is scattered across QueueCard's per-status inline
// buttons. Reuses the exact same mutation hooks and reason/transfer
// sub-modals as QueueCard -- not reimplemented -- so behavior is identical.
// Open Visit remains available before Payment/Invoice is settled: its only
// precondition (Queue must be CALLED, docs/06-tasks/task-048.md) is
// unchanged by this addendum.
//
// docs/06-tasks/task-319.md: "Open Visit" only ever *creates* a Visit and
// is gated to CALLED (task-048.md's own precondition). Once a Visit
// already exists for this Queue (visitId present -- e.g. the entry is now
// COMPLETED, per task-316.md's now-editable-after-completion rule), a
// separate "View Visit" link navigates straight to it instead, independent
// of Queue status, so a completed entry's SOAP/Vital Sign/etc. can still be
// reached and edited.
export function QueueDetailModal({ queueId, onClose }: { queueId: string; onClose: () => void }) {
  const router = useRouter();
  const [subModal, setSubModal] = useState<"skip" | "cancel" | "transfer" | null>(null);
  const { data: queue, isLoading } = useQueueDetail(queueId);
  const callQueue = useCallQueue();
  const recallQueue = useRecallQueue();
  const startService = useStartQueueService();
  const completeQueue = useCompleteQueue();
  const skipQueue = useSkipQueue();
  const cancelQueue = useCancelQueue();
  const openVisit = useOpenVisit();
  const { data: doctorsData } = useDoctors();

  const doctorName = queue ? doctorsData?.items.find((d) => d.id === queue.doctorId)?.fullName : undefined;

  return (
    <Modal title="Queue Detail" onClose={onClose}>
      {isLoading && <p className="text-sm text-muted">Loading...</p>}
      {queue && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold text-foreground">{queue.queueNumber}</span>
              <Badge tone={QUEUE_STATUS_TONE[queue.status]}>{queue.status.replace("_", " ")}</Badge>
            </div>
            {queue.patientFullName && (
              <div className="mt-2 text-sm font-medium text-foreground">
                {queue.patientFullName}
                {queue.patientMrn && <span className="ml-1 font-tabular text-xs font-normal text-muted">({queue.patientMrn})</span>}
              </div>
            )}
            {doctorName && <div className="mt-0.5 text-sm text-foreground">{doctorName}</div>}
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
              <dt>Type</dt>
              <dd className="text-foreground">{queue.queueType}</dd>
              <dt>Priority</dt>
              <dd className="text-foreground">{queue.priority}</dd>
              <dt>Checked In</dt>
              <dd className="font-tabular text-foreground">{new Date(queue.checkedInAt).toLocaleString()}</dd>
              {queue.calledAt && (
                <>
                  <dt>Called</dt>
                  <dd className="font-tabular text-foreground">{new Date(queue.calledAt).toLocaleString()}</dd>
                </>
              )}
              {queue.startedAt && (
                <>
                  <dt>Started</dt>
                  <dd className="font-tabular text-foreground">{new Date(queue.startedAt).toLocaleString()}</dd>
                </>
              )}
              {queue.completedAt && (
                <>
                  <dt>Completed</dt>
                  <dd className="font-tabular text-foreground">{new Date(queue.completedAt).toLocaleString()}</dd>
                </>
              )}
              {queue.notes && (
                <>
                  <dt>Notes</dt>
                  <dd className="text-foreground">{queue.notes}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
            {queue.visitId && (
              <PermissionGuard permission="emr.visit.read">
                <Button variant="tertiary" onClick={() => router.push(`/emr/visits/${queue.visitId}`)}>
                  View Visit
                </Button>
              </PermissionGuard>
            )}
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
                {!queue.visitId && (
                  <PermissionGuard permission="emr.visit.create">
                    <Button variant="tertiary" isLoading={openVisit.isPending} onClick={() => openVisit.mutate(queue.id)}>
                      Open Visit
                    </Button>
                  </PermissionGuard>
                )}
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
                <Button variant="tertiary" onClick={() => setSubModal("skip")}>
                  Skip
                </Button>
              </PermissionGuard>
            )}
            {queue.status === "WAITING" && (
              <PermissionGuard permission="queue.cancel">
                <Button variant="danger" onClick={() => setSubModal("cancel")}>
                  Cancel
                </Button>
              </PermissionGuard>
            )}
            {["WAITING", "CALLED", "SKIPPED"].includes(queue.status) && (
              <PermissionGuard permission="queue.transfer">
                <Button variant="tertiary" onClick={() => setSubModal("transfer")}>
                  Transfer
                </Button>
              </PermissionGuard>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>

          {subModal === "skip" && (
            <QueueReasonModal
              title="Skip Queue Entry"
              submitLabel="Confirm Skip"
              isSubmitting={skipQueue.isPending}
              submitError={skipQueue.isError ? getApiErrorMessage(skipQueue.error) : undefined}
              onClose={() => setSubModal(null)}
              onSubmit={(reason) => skipQueue.mutate({ id: queue.id, reason }, { onSuccess: () => setSubModal(null) })}
            />
          )}
          {subModal === "cancel" && (
            <QueueReasonModal
              title="Cancel Queue Entry"
              submitLabel="Confirm Cancel"
              isSubmitting={cancelQueue.isPending}
              submitError={cancelQueue.isError ? getApiErrorMessage(cancelQueue.error) : undefined}
              onClose={() => setSubModal(null)}
              onSubmit={(reason) => cancelQueue.mutate({ id: queue.id, reason }, { onSuccess: () => setSubModal(null) })}
            />
          )}
          {subModal === "transfer" && (
            <TransferQueueModal queueId={queue.id} currentDoctorId={queue.doctorId} onClose={() => setSubModal(null)} />
          )}
        </div>
      )}
    </Modal>
  );
}
