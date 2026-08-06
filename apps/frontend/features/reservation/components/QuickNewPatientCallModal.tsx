"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useQuickNewPatientCall } from "../hooks/useReservationMutations";
import { TimeSlotPicker } from "./TimeSlotPicker";

// docs/06-tasks/task-292.md (Epic RE3, Reservation Module Enhancement
// addendum): offered on the Reservation booking screen's PatientPicker
// alongside the existing "Quick Add Patient" action (task-289) when Search
// Patient returns no results -- both remain available; which is visually
// primary is an open product decision (SAD §39.7 item 1, not resolved
// here). One submit creates the patient and the reservation together,
// atomically, skipping the intermediate "patient selected, now finish
// booking" step Quick Add Patient still requires.
export function QuickNewPatientCallModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [complaint, setComplaint] = useState("");

  const { data: doctorsData } = useDoctors();
  const quickCall = useQuickNewPatientCall();

  const isFormValid =
    fullName.trim().length > 0 &&
    address.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    identityNumber.trim().length > 0 &&
    Boolean(doctorId) &&
    Boolean(reservationDate) &&
    Boolean(startTime);

  function handleSubmit() {
    quickCall.mutate({
      fullName,
      address,
      phoneNumber,
      identityNumber,
      doctorId,
      reservationDate,
      startTime,
      complaint: complaint || undefined,
    });
  }

  return (
    <Modal title="Quick Call: Create & Book Now" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input id="quickCallFullName" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input id="quickCallAddress" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <Input id="quickCallPhoneNumber" label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        <Input
          id="quickCallIdentityNumber"
          label="Identity Number"
          value={identityNumber}
          onChange={(e) => setIdentityNumber(e.target.value)}
          required
        />

        <Select id="quickCallDoctorId" label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
          <option value="">Select a doctor</option>
          {doctorsData?.items.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.fullName} {doctor.specialization ? `(${doctor.specialization})` : ""}
            </option>
          ))}
        </Select>

        <Input
          id="quickCallDate"
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

        <Textarea id="quickCallComplaint" label="Complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)} />

        {quickCall.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(quickCall.error)}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={quickCall.isPending} disabled={!isFormValid} onClick={handleSubmit}>
            Create & Book Now
          </Button>
        </div>
      </div>
    </Modal>
  );
}
