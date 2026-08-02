"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

// Shared by Skip and Cancel (task-042/045): both accept an optional reason,
// unlike Reservation's Cancel where the reason is mandatory.
export function QueueReasonModal({
  title,
  submitLabel,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string;
  onClose: () => void;
  onSubmit: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(reason || undefined);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Textarea id="queueReason" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        {submitError && (
          <p role="alert" className="text-sm text-error">
            {submitError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
