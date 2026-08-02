"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRescheduleReservation } from "../hooks/useReservationMutations";
import { TimeSlotPicker } from "./TimeSlotPicker";

export function RescheduleModal({
  reservationId,
  doctorId,
  onClose,
}: {
  reservationId: string;
  doctorId: string;
  onClose: () => void;
}) {
  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const reschedule = useRescheduleReservation(reservationId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reschedule.mutate({ reservationDate, startTime }, { onSuccess: onClose });
  }

  return (
    <Modal title="Reschedule Reservation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="rescheduleDate"
          label="New Date"
          type="date"
          value={reservationDate}
          onChange={(e) => {
            setReservationDate(e.target.value);
            setStartTime("");
          }}
          required
        />
        {reservationDate && <TimeSlotPicker doctorId={doctorId} date={reservationDate} selectedTime={startTime} onSelect={setStartTime} />}
        {reschedule.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(reschedule.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={reschedule.isPending} disabled={!reservationDate || !startTime}>
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
