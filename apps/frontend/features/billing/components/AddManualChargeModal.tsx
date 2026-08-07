"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAddManualCharge } from "../hooks/useInvoiceMutations";

// docs/06-tasks/task-323.md
export function AddManualChargeModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const addManualCharge = useAddManualCharge(invoiceId);

  function handleSubmit() {
    const numericAmount = Number(amount);
    if (!itemName.trim() || !(numericAmount > 0) || !reason.trim()) return;
    addManualCharge.mutate({ itemName: itemName.trim(), amount: numericAmount, reason: reason.trim() }, { onSuccess: onClose });
  }

  return (
    <Modal title="Add Manual Charge" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input id="chargeItemName" label="Item Name" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
        <Input id="chargeAmount" label="Amount" type="number" min={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Textarea id="chargeReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {addManualCharge.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(addManualCharge.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button
            type="button"
            isLoading={addManualCharge.isPending}
            disabled={!itemName.trim() || !(Number(amount) > 0) || !reason.trim()}
            onClick={handleSubmit}
          >
            Add Charge
          </Button>
        </div>
      </div>
    </Modal>
  );
}
