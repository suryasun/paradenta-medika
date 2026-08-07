"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { usePaymentMethods } from "@/features/master-data/hooks/usePaymentMethods";
import { useInsuranceProviders } from "@/features/master-data/hooks/useInsuranceProviders";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useCreatePayment } from "../hooks/useInvoiceMutations";
import { PaymentLineInput } from "../types/billing.types";

interface DraftLine {
  paymentMethodId: string;
  amount: string;
  // docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md:
  // UC-BIL-006 Apply Insurance, modeled as a payment allocation -- Payer
  // toggle per line, defaulting to PATIENT (same as every pre-task-332 line).
  payerType: "PATIENT" | "INSURANCE";
  insuranceProviderId: string;
  policyNumber: string;
}

// docs/06-tasks/task-057.md: supports Multiple Payment (split across
// methods) in a single POST /billing/payments call -- lines are staged
// locally, same pattern as EMR's DiagnosisSection batching.
export function CreatePaymentModal({ invoiceId, outstanding, onClose }: { invoiceId: string; outstanding: number; onClose: () => void }) {
  const [lines, setLines] = useState<DraftLine[]>([
    { paymentMethodId: "", amount: String(outstanding), payerType: "PATIENT", insuranceProviderId: "", policyNumber: "" },
  ]);
  // Amount stays editable in both modes -- this is a discoverability aid
  // ("partial payment is a supported, intentional choice"), not a hard lock,
  // so it never fights Split Payment's manual per-line amounts.
  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const { data: paymentMethodsData } = usePaymentMethods();
  const { data: insuranceProvidersData } = useInsuranceProviders();
  const createPayment = useCreatePayment(invoiceId);

  const total = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const canSubmit =
    lines.every(
      (line) => line.paymentMethodId && Number(line.amount) > 0 && (line.payerType === "PATIENT" || line.insuranceProviderId),
    ) &&
    total > 0 &&
    total <= outstanding;

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function handlePaymentTypeChange(value: "FULL" | "PARTIAL") {
    setPaymentType(value);
    // Only pre-fill when a single line is staged -- once the Cashier has
    // started a Split Payment, don't clobber their manually-entered amounts.
    setLines((prev) => (prev.length === 1 ? [{ ...prev[0], amount: value === "FULL" ? String(outstanding) : "" }] : prev));
  }

  function addLine() {
    setLines((prev) => [...prev, { paymentMethodId: "", amount: "", payerType: "PATIENT", insuranceProviderId: "", policyNumber: "" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const payload: PaymentLineInput[] = lines.map((line) => ({
      paymentMethodId: line.paymentMethodId,
      amount: Number(line.amount),
      payerType: line.payerType,
      ...(line.payerType === "INSURANCE"
        ? { insuranceProviderId: line.insuranceProviderId, policyNumber: line.policyNumber || undefined }
        : {}),
    }));
    createPayment.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Modal title="Record Payment" onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        <p className="font-tabular text-sm text-muted">Outstanding: {formatCurrency(outstanding)}</p>

        <Select
          id="paymentType"
          label="Payment Type"
          value={paymentType}
          onChange={(e) => handlePaymentTypeChange(e.target.value as "FULL" | "PARTIAL")}
          className="w-48"
        >
          <option value="FULL">Full Payment</option>
          <option value="PARTIAL">Partial Payment</option>
        </Select>

        {lines.map((line, index) => (
          // New lines animate in (design-system.md §11 micro-interaction);
          // existing lines keep their index/key so they don't remount
          // (and don't replay the animation) when a line is appended.
          <div key={index} className="flex animate-[tab-fade-in_180ms_ease-out] flex-col gap-2 rounded border border-border p-2">
            <div className="flex flex-wrap items-end gap-2">
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
            {/* docs/06-tasks/task-332.md: UC-BIL-006 Apply Insurance, modeled as a
                payment allocation -- Payer toggle per line. */}
            <div className="flex flex-wrap items-end gap-2">
              <Select
                id={`payerType-${index}`}
                label="Payer"
                value={line.payerType}
                onChange={(e) =>
                  updateLine(index, {
                    payerType: e.target.value as "PATIENT" | "INSURANCE",
                    insuranceProviderId: "",
                    policyNumber: "",
                  })
                }
                className="w-40"
              >
                <option value="PATIENT">Patient</option>
                <option value="INSURANCE">Insurance</option>
              </Select>
              {line.payerType === "INSURANCE" && (
                <>
                  <Select
                    id={`insuranceProvider-${index}`}
                    label="Insurance Provider"
                    value={line.insuranceProviderId}
                    onChange={(e) => updateLine(index, { insuranceProviderId: e.target.value })}
                    className="flex-1"
                  >
                    <option value="">Select provider</option>
                    {insuranceProvidersData?.items
                      .filter((provider) => provider.isActive)
                      .map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.providerName}
                        </option>
                      ))}
                  </Select>
                  <Input
                    id={`policyNumber-${index}`}
                    label="Policy Number"
                    value={line.policyNumber}
                    onChange={(e) => updateLine(index, { policyNumber: e.target.value })}
                    className="w-40"
                  />
                </>
              )}
            </div>
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
