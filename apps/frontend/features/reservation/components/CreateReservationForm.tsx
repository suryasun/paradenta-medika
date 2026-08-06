"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { PatientPicker } from "@/features/patient/components/PatientPicker";
import { Patient } from "@/features/patient/types/patient.types";
import { useCreateReservation } from "../hooks/useReservationMutations";
import { CreateReservationInput, Reservation } from "../types/reservation.types";
import { QuickNewPatientCallModal } from "./QuickNewPatientCallModal";
import { TimeSlotPicker } from "./TimeSlotPicker";

const RESERVATION_TYPES: Reservation["reservationType"][] = ["APPOINTMENT", "FOLLOW_UP", "EMERGENCY", "CONSULTATION"];
const SOURCES: Reservation["reservationSource"][] = ["PHONE", "WHATSAPP", "WEBSITE", "MOBILE_APP"];

// docs/06-tasks/task-002.md: a single POST /reservations backs both a
// scheduled appointment and Walk-in registration, dispatched server-side by
// source/reservationType. This form exposes that as an explicit toggle
// rather than making staff guess which fields to leave blank.
export function CreateReservationForm() {
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [reservationType, setReservationType] = useState<Reservation["reservationType"]>("APPOINTMENT");
  const [source, setSource] = useState<Reservation["reservationSource"]>("PHONE");
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [showQuickCall, setShowQuickCall] = useState(false);

  const { data: doctorsData } = useDoctors();
  const createReservation = useCreateReservation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patient || !doctorId) return;

    const payload: CreateReservationInput = {
      patientId: patient.id,
      doctorId,
      reservationType: isWalkIn ? "WALK_IN" : reservationType,
      source: isWalkIn ? "WALK_IN" : source,
      complaint: complaint || undefined,
      notes: notes || undefined,
      ...(isWalkIn ? {} : { reservationDate, startTime }),
    };
    createReservation.mutate(payload);
  }

  const canSubmit = Boolean(patient && doctorId && (isWalkIn || (reservationDate && startTime)));

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input type="checkbox" checked={isWalkIn} onChange={(e) => setIsWalkIn(e.target.checked)} />
        Walk-in (no appointment slot needed)
      </label>

      <PatientPicker selectedPatient={patient} onSelect={setPatient} />

      {/* task-292 (Epic RE3): alongside Quick Add Patient (task-289) for a
          caller not yet in the system who also wants to book in the same
          step -- which of the two is visually primary is an open product
          decision (SAD §39.7 item 1), not resolved here. */}
      {!patient && (
        <button
          type="button"
          className="self-start text-xs font-medium text-primary hover:underline"
          onClick={() => setShowQuickCall(true)}
        >
          Quick Call: Create & Book Now
        </button>
      )}
      {showQuickCall && <QuickNewPatientCallModal onClose={() => setShowQuickCall(false)} />}

      <Select id="doctorId" label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
        <option value="">Select a doctor</option>
        {doctorsData?.items.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.fullName} {doctor.specialization ? `(${doctor.specialization})` : ""}
          </option>
        ))}
      </Select>

      {!isWalkIn && (
        <>
          <Input
            id="reservationDate"
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
            id="reservationType"
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
          <Select id="source" label="Source" value={source} onChange={(e) => setSource(e.target.value as Reservation["reservationSource"])}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </>
      )}

      <Textarea id="complaint" label="Complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
      <Textarea id="notes" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {createReservation.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(createReservation.error)}
        </p>
      )}

      <Button type="submit" isLoading={createReservation.isPending} disabled={!canSubmit} className="mt-2 self-start">
        {isWalkIn ? "Register Walk-in" : "Book Reservation"}
      </Button>
    </form>
  );
}
