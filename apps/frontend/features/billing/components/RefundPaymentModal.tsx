"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useRefundPayment } from "../hooks/useInvoiceMutations";

// docs/06-tasks/task-326.md
export function RefundPaymentModal({
  invoiceId,
  paymentId,
  remainingRefundable,
  onClose,
}: {
  invoiceId: string;
  paymentId: string;
  remainingRefundable: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const refundPayment = useRefundPayment(invoiceId);

  function handleSubmit() {
    const numericAmount = Number(amount);
    if (!(numericAmount > 0) || !reason.trim()) return;
    refundPayment.mutate({ paymentId, payload: { amount: numericAmount, reason: reason.trim() } }, { onSuccess: onClose });
  }

  return (
    <Modal title="Refund Payment" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">Remaining refundable: {formatCurrency(remainingRefundable)}</p>
        <Input
          id="refundAmount"
          label="Refund Amount"
          type="number"
          min={0.01}
          max={remainingRefundable}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Textarea id="refundReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {refundPayment.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(refundPayment.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={refundPayment.isPending}
            disabled={!(Number(amount) > 0) || !reason.trim()}
            onClick={handleSubmit}
          >
            Confirm Refund
          </Button>
        </div>
      </div>
    </Modal>
  );
}
