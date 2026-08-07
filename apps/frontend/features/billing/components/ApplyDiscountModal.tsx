"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { useApplyDiscount } from "../hooks/useInvoiceMutations";
import { DISCOUNT_SOURCES, DiscountSource } from "../types/billing.types";

// docs/06-tasks/task-322.md
export function ApplyDiscountModal({ invoiceId, subtotal, onClose }: { invoiceId: string; subtotal: number; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<DiscountSource>("MANUAL");
  const [reason, setReason] = useState("");
  const applyDiscount = useApplyDiscount(invoiceId);

  function handleSubmit() {
    const numericAmount = Number(amount);
    if (!(numericAmount > 0) || !reason.trim()) return;
    applyDiscount.mutate({ amount: numericAmount, source, reason: reason.trim() }, { onSuccess: onClose });
  }

  return (
    <Modal title="Apply Discount" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input
          id="discountAmount"
          label="Discount Amount"
          type="number"
          min={0.01}
          max={subtotal}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Select id="discountSource" label="Source" value={source} onChange={(e) => setSource(e.target.value as DiscountSource)} required>
          {DISCOUNT_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Textarea id="discountReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {applyDiscount.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(applyDiscount.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button
            type="button"
            isLoading={applyDiscount.isPending}
            disabled={!(Number(amount) > 0) || !reason.trim()}
            onClick={handleSubmit}
          >
            Apply Discount
          </Button>
        </div>
      </div>
    </Modal>
  );
}
