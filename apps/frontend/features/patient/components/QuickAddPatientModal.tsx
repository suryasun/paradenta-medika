"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-client";
import { useQuickAddPatient } from "../hooks/usePatientMutations";
import { Patient } from "../types/patient.types";

// task-289 (Epic PE6, Patient Module Enhancement addendum). Field
// contract per docs/03-sad/12-module-patient.md §21.1a: fullName, address
// (free text), phoneNumber, identityNumber only -- no gender/dateOfBirth/
// email. Exact placement/visual treatment on the Reservation booking
// screen is deferred to a future task per this task's own Frontend Scope;
// this is the field contract + wiring only.
export function QuickAddPatientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (patient: Patient) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");

  const quickAddPatient = useQuickAddPatient();

  const isFormValid =
    fullName.trim().length > 0 && address.trim().length > 0 && phoneNumber.trim().length > 0 && identityNumber.trim().length > 0;

  function handleSubmit() {
    quickAddPatient.mutate(
      { fullName, address, phoneNumber, identityNumber },
      { onSuccess: (patient) => onCreated(patient) },
    );
  }

  return (
    <Modal title="Quick Add Patient" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input id="quickAddFullName" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input id="quickAddAddress" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <Input id="quickAddPhoneNumber" label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        <Input
          id="quickAddIdentityNumber"
          label="Identity Number"
          value={identityNumber}
          onChange={(e) => setIdentityNumber(e.target.value)}
          required
        />
        {quickAddPatient.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(quickAddPatient.error)}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={quickAddPatient.isPending} disabled={!isFormValid} onClick={handleSubmit}>
            Create & Continue Booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
