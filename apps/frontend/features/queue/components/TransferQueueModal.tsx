"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { getApiErrorMessage } from "@/lib/api-client";
import { useTransferQueue } from "../hooks/useQueueMutations";

export function TransferQueueModal({ queueId, currentDoctorId, onClose }: { queueId: string; currentDoctorId: string; onClose: () => void }) {
  const [doctorId, setDoctorId] = useState("");
  const [reason, setReason] = useState("");
  const { data: doctorsData } = useDoctors();
  const transferQueue = useTransferQueue();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    transferQueue.mutate({ id: queueId, doctorId, reason }, { onSuccess: onClose });
  }

  return (
    <Modal title="Transfer Queue" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select id="transferDoctor" label="New Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
          <option value="">Select a doctor</option>
          {doctorsData?.items
            .filter((doctor) => doctor.id !== currentDoctorId)
            .map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.fullName}
              </option>
            ))}
        </Select>
        <Textarea id="transferReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {transferQueue.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(transferQueue.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button type="submit" isLoading={transferQueue.isPending} disabled={!doctorId || !reason.trim()}>
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
