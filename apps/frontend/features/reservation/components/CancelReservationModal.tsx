"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCancelReservation } from "../hooks/useReservationMutations";

// docs/03-sad/13-module-reservation.md Section 18.2: "Wajib mengisi alasan
// pembatalan" -- reason is mandatory, enforced both here and server-side.
export function CancelReservationModal({ reservationId, onClose }: { reservationId: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const cancelReservation = useCancelReservation(reservationId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cancelReservation.mutate(reason, { onSuccess: onClose });
  }

  return (
    <Modal title="Cancel Reservation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Textarea id="cancelReason" label="Cancellation Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {cancelReservation.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(cancelReservation.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button type="submit" variant="danger" isLoading={cancelReservation.isPending} disabled={!reason.trim()}>
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
