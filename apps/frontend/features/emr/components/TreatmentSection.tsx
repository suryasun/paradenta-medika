"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { useTreatments } from "@/features/master-data/hooks/useTreatments";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useRecordTreatment } from "../hooks/useVisitMutations";
import { TreatmentEntry } from "../types/emr.types";

// docs/06-tasks/task-053.md: price is snapshotted server-side at entry
// time from the Treatment catalog, so unitPrice/subtotal shown in the
// table below reflect what was actually billed, not the current catalog
// price if it has since changed.
//
// docs/06-tasks/task-318.md: `readOnly` here already folds in the
// payment-driven lock (VisitWorkspace passes `treatmentReadOnly`, not the
// plain visit-status `readOnly`, into this section) -- `isPaymentLocked`
// is a narrower flag used only to decide whether to show the "invoice
// paid" explanation (it's true only when the *visit itself* is still
// open but Treatment specifically is locked; a LOCKED/ARCHIVED visit
// already explains its own read-only state some other way).
export function TreatmentSection({
  visitId,
  treatmentEntries,
  readOnly,
  isPaymentLocked,
}: {
  visitId: string;
  treatmentEntries: TreatmentEntry[];
  readOnly: boolean;
  isPaymentLocked?: boolean;
}) {
  const [treatmentId, setTreatmentId] = useState("");
  const [toothReference, setToothReference] = useState("");
  const [quantity, setQuantity] = useState("1");
  const { data: treatmentsData } = useTreatments();
  const recordTreatment = useRecordTreatment(visitId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!treatmentId) return;
    recordTreatment.mutate(
      { treatmentId, toothReference: toothReference || undefined, quantity: Number(quantity) || 1 },
      { onSuccess: () => { setTreatmentId(""); setToothReference(""); setQuantity("1"); } },
    );
  }

  const treatmentName = (id: string) => treatmentsData?.items.find((t) => t.id === id)?.treatmentName ?? id;

  return (
    <div className="flex flex-col gap-4">
      {treatmentEntries.length === 0 ? (
        <EmptyState title="No treatments recorded yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Treatment</TableHeaderCell>
              <TableHeaderCell>Tooth</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Unit Price</TableHeaderCell>
              <TableHeaderCell>Subtotal</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {treatmentEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{treatmentName(entry.treatmentId)}</TableCell>
                <TableCell>{entry.toothReference ?? "-"}</TableCell>
                <TableCell>{entry.quantity}</TableCell>
                <TableCell>{formatCurrency(entry.unitPrice)}</TableCell>
                <TableCell>{formatCurrency(entry.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isPaymentLocked && (
        <p className="rounded-md border border-border bg-[var(--color-warning-100)] px-3 py-2 text-sm text-foreground">
          Locked — invoice paid. Treatment can no longer be added or edited for this visit.
        </p>
      )}

      {!readOnly && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
          <Select id="treatmentId" label="Treatment" value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} required className="min-w-64">
            <option value="">Select a treatment</option>
            {treatmentsData?.items.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.treatmentName} ({formatCurrency(treatment.defaultPrice)})
              </option>
            ))}
          </Select>
          <Input id="toothReference" label="Tooth Reference" value={toothReference} onChange={(e) => setToothReference(e.target.value)} />
          <Input id="quantity" label="Quantity" type="number" min={1} max={100} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Button type="submit" isLoading={recordTreatment.isPending} disabled={!treatmentId}>
            Add Treatment
          </Button>
          {recordTreatment.isError && (
            <p role="alert" className="w-full text-sm text-error">
              {getApiErrorMessage(recordTreatment.error)}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
