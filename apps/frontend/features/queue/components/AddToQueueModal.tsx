"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { PatientPicker } from "@/features/patient/components/PatientPicker";
import { Patient } from "@/features/patient/types/patient.types";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCreateQueueEntry } from "../hooks/useQueueMutations";

// docs/06-tasks/task-037.md: POST /queues for a walk-in patient who needs a
// Queue entry directly, without going through Reservation + Check-In first.
export function AddToQueueModal({ onClose }: { onClose: () => void }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const { data: doctorsData } = useDoctors();
  const createQueueEntry = useCreateQueueEntry();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patient || !doctorId) return;
    createQueueEntry.mutate({ patientId: patient.id, doctorId, isEmergency }, { onSuccess: onClose });
  }

  return (
    <Modal title="Add Walk-in to Queue" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PatientPicker selectedPatient={patient} onSelect={setPatient} />
        <Select id="queueDoctor" label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
          <option value="">Select a doctor</option>
          {doctorsData?.items.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.fullName}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
          Emergency priority
        </label>
        {createQueueEntry.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createQueueEntry.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createQueueEntry.isPending} disabled={!patient || !doctorId}>
            Add to Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
