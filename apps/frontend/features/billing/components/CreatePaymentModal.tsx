"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { usePaymentMethods } from "@/features/master-data/hooks/usePaymentMethods";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useCreatePayment } from "../hooks/useInvoiceMutations";
import { PaymentLineInput } from "../types/billing.types";

interface DraftLine {
  paymentMethodId: string;
  amount: string;
}

// docs/06-tasks/task-057.md: supports Multiple Payment (split across
// methods) in a single POST /billing/payments call -- lines are staged
// locally, same pattern as EMR's DiagnosisSection batching.
export function CreatePaymentModal({ invoiceId, outstanding, onClose }: { invoiceId: string; outstanding: number; onClose: () => void }) {
  const [lines, setLines] = useState<DraftLine[]>([{ paymentMethodId: "", amount: String(outstanding) }]);
  const { data: paymentMethodsData } = usePaymentMethods();
  const createPayment = useCreatePayment(invoiceId);

  const total = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const canSubmit = lines.every((line) => line.paymentMethodId && Number(line.amount) > 0) && total > 0 && total <= outstanding;

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { paymentMethodId: "", amount: "" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const payload: PaymentLineInput[] = lines.map((line) => ({ paymentMethodId: line.paymentMethodId, amount: Number(line.amount) }));
    createPayment.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Modal title="Record Payment" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="font-tabular text-sm text-muted">Outstanding: {formatCurrency(outstanding)}</p>

        {lines.map((line, index) => (
          // New lines animate in (design-system.md §11 micro-interaction);
          // existing lines keep their index/key so they don't remount
          // (and don't replay the animation) when a line is appended.
          <div key={index} className="flex animate-[tab-fade-in_180ms_ease-out] items-end gap-2">
            <Select
              id={`paymentMethod-${index}`}
              label="Method"
              value={line.paymentMethodId}
              onChange={(e) => updateLine(index, { paymentMethodId: e.target.value })}
              className="flex-1"
            >
              <option value="">Select method</option>
              {paymentMethodsData?.items.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.methodName}
                </option>
              ))}
            </Select>
            <Input
              id={`amount-${index}`}
              label="Amount"
              type="number"
              value={line.amount}
              onChange={(e) => updateLine(index, { amount: e.target.value })}
              className="w-36 font-tabular"
            />
            {lines.length > 1 && (
              <Button type="button" variant="ghost" onClick={() => removeLine(index)}>
                Remove
              </Button>
            )}
          </div>
        ))}

        <Button type="button" variant="secondary" onClick={addLine} className="self-start">
          Split Payment (+)
        </Button>

        <p className="font-tabular text-sm text-foreground">
          Total: {formatCurrency(total)} {total > outstanding && <span className="text-error">exceeds outstanding balance</span>}
        </p>

        {createPayment.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createPayment.error)}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" isLoading={createPayment.isPending} disabled={!canSubmit} onClick={handleSubmit}>
            Confirm Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
