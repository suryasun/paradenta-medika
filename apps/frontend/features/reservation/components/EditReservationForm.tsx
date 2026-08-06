"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useReservation } from "../hooks/useReservation";
import { useUpdateReservation } from "../hooks/useReservationMutations";
import { Reservation, UpdateReservationInput } from "../types/reservation.types";
import { TimeSlotPicker } from "./TimeSlotPicker";

const RESERVATION_TYPES: Reservation["reservationType"][] = ["APPOINTMENT", "WALK_IN", "FOLLOW_UP", "EMERGENCY", "CONSULTATION"];
const EDITABLE_STATUSES: Reservation["status"][] = ["BOOKED", "CONFIRMED"];

// docs/06-tasks/task-302.md (Reservation Module Addendum #3): the backend
// (PUT /reservations/:id, UpdateReservationUseCase) and the frontend
// mutation (useUpdateReservation) already existed but had no consumer --
// this is their first real UI. Editable fields mirror
// UpdateReservationRequestDto exactly (Doctor, Date, Time Slot,
// Reservation Type, Complaint, Notes) -- Patient is intentionally not
// editable, since the backend contract has no patientId field to change it.
export function EditReservationForm({ reservationId }: { reservationId: string }) {
  const { data: reservation, isLoading, isError, error, refetch } = useReservation(reservationId);
  const updateReservation = useUpdateReservation(reservationId);

  const [doctorId, setDoctorId] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [reservationType, setReservationType] = useState<Reservation["reservationType"]>("APPOINTMENT");
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { data: doctorsData } = useDoctors();

  // Pre-fill once, when the reservation first loads -- an "adjust during
  // render" style init would refire on every background refetch and stomp
  // in-progress edits, so this is the one place in this feature that
  // genuinely needs useEffect rather than the render-time sync pattern
  // other forms in this codebase use for one-shot initial values.
  useEffect(() => {
    if (reservation && !initialized) {
      setDoctorId(reservation.doctorId);
      setReservationDate(reservation.reservationDate);
      setStartTime(reservation.startTime);
      setReservationType(reservation.reservationType);
      setComplaint(reservation.complaint ?? "");
      setNotes(reservation.notes ?? "");
      setInitialized(true);
    }
  }, [reservation, initialized]);

  if (isLoading) return <LoadingState label="Loading reservation..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!reservation) return null;

  if (!EDITABLE_STATUSES.includes(reservation.status)) {
    return (
      <p className="text-sm text-muted">
        This reservation ({reservation.status}) can no longer be edited. Only BOOKED or CONFIRMED reservations can be changed.
      </p>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: UpdateReservationInput = {
      doctorId,
      reservationDate,
      startTime,
      reservationType,
      complaint: complaint || undefined,
      notes: notes || undefined,
    };
    updateReservation.mutate(payload);
  }

  const canSubmit = Boolean(doctorId && reservationDate && startTime);

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <Select id="editDoctorId" label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
        <option value="">Select a doctor</option>
        {doctorsData?.items.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.fullName} {doctor.specialization ? `(${doctor.specialization})` : ""}
          </option>
        ))}
      </Select>

      <Input
        id="editReservationDate"
        label="Date"
        type="date"
        value={reservationDate}
        onChange={(e) => {
          setReservationDate(e.target.value);
          setStartTime("");
        }}
        required
      />

      {doctorId && reservationDate && (
        <div>
          <span className="text-sm font-medium text-foreground">Time Slot</span>
          <div className="mt-1">
            <TimeSlotPicker doctorId={doctorId} date={reservationDate} selectedTime={startTime} onSelect={setStartTime} />
          </div>
        </div>
      )}

      <Select
        id="editReservationType"
        label="Reservation Type"
        value={reservationType}
        onChange={(e) => setReservationType(e.target.value as Reservation["reservationType"])}
      >
        {RESERVATION_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </Select>

      <Textarea id="editComplaint" label="Complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
      <Textarea id="editNotes" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {updateReservation.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(updateReservation.error)}
        </p>
      )}

      <Button type="submit" isLoading={updateReservation.isPending} disabled={!canSubmit} className="mt-2 self-start">
        Save Changes
      </Button>
    </form>
  );
}
