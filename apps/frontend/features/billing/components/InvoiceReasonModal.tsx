"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

// docs/06-tasks/task-324.md/task-325.md: shared by Cancel and Void, both of
// which require a mandatory reason (unlike Queue's Skip/Cancel, where the
// reason is optional) -- mirrors QueueReasonModal's shape.
export function InvoiceReasonModal({
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
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Textarea id="invoiceReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {submitError && (
          <p role="alert" className="text-sm text-error">
            {submitError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting} disabled={!reason.trim()}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
