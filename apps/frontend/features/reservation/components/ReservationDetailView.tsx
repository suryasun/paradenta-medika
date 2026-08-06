"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useReservation } from "../hooks/useReservation";
import { useCheckInReservation } from "../hooks/useReservationMutations";
import { RESERVATION_STATUS_TONE } from "./ReservationListView";
import { RescheduleModal } from "./RescheduleModal";
import { CancelReservationModal } from "./CancelReservationModal";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value || "-"}</dd>
    </div>
  );
}

const OPEN_STATUSES = ["BOOKED", "CONFIRMED"];

export function ReservationDetailView({ reservationId }: { reservationId: string }) {
  const { data: reservation, isLoading, isError, error, refetch } = useReservation(reservationId);
  const checkInReservation = useCheckInReservation(reservationId);
  const [activeModal, setActiveModal] = useState<"reschedule" | "cancel" | null>(null);

  if (isLoading) return <LoadingState label="Loading reservation..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!reservation) return null;

  const canModify = OPEN_STATUSES.includes(reservation.status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{reservation.reservationNumber}</h1>
          <Badge tone={RESERVATION_STATUS_TONE[reservation.status]}>{reservation.status}</Badge>
        </div>
        {canModify && (
          <div className="flex gap-2">
            <PermissionGuard permission="reservation.check-in">
              <Button isLoading={checkInReservation.isPending} onClick={() => checkInReservation.mutate()}>
                Check In
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="reservation.reschedule">
              <Button variant="secondary" onClick={() => setActiveModal("reschedule")}>
                Reschedule
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="reservation.cancel">
              <Button variant="danger" onClick={() => setActiveModal("cancel")}>
                Cancel
              </Button>
            </PermissionGuard>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
        <Field label="Date" value={reservation.reservationDate} />
        <Field label="Time" value={reservation.startTime} />
        <Field label="Type" value={reservation.reservationType} />
        <Field label="Source" value={reservation.reservationSource} />
        <Field label="Complaint" value={reservation.complaint} />
        <Field label="Notes" value={reservation.notes} />
        <Field label="Patient Type" value={reservation.patientType} />
        <Field label="Checked In At" value={reservation.checkedInAt} />
        {reservation.status === "CANCELLED" && <Field label="Cancellation Reason" value={reservation.cancelledReason} />}
      </dl>

      {activeModal === "reschedule" && (
        <RescheduleModal reservationId={reservationId} doctorId={reservation.doctorId} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "cancel" && <CancelReservationModal reservationId={reservationId} onClose={() => setActiveModal(null)} />}
    </div>
  );
}
