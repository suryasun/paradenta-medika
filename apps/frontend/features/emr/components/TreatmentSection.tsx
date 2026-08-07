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
import { useRecordTreatment, useRemoveTreatment, useUpdateTreatment } from "../hooks/useVisitMutations";
import { TreatmentEntry } from "../types/emr.types";

// docs/06-tasks/task-321.md: per-row Edit (Tooth/Qty/Unit Price/Notes) and
// Remove, both gated the same way "Add Treatment" already is (!readOnly,
// which folds in the payment lock -- see TreatmentSection's own gating
// below) and enforced identically server-side (assertTreatmentEditable,
// task-317 -- blocked once the linked Invoice is PAID).
function TreatmentRow({
  visitId,
  entry,
  treatmentName,
  readOnly,
}: {
  visitId: string;
  entry: TreatmentEntry;
  treatmentName: string;
  readOnly: boolean;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirmRemove">("view");
  const [toothReference, setToothReference] = useState(entry.toothReference ?? "");
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [unitPrice, setUnitPrice] = useState(String(entry.unitPrice));
  const [notes, setNotes] = useState(entry.notes ?? "");
  const updateTreatment = useUpdateTreatment(visitId);
  const removeTreatment = useRemoveTreatment(visitId);

  function handleSave() {
    updateTreatment.mutate(
      {
        treatmentEntryId: entry.id,
        payload: {
          toothReference: toothReference || undefined,
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice) || 0,
          notes: notes || undefined,
        },
      },
      { onSuccess: () => setMode("view") },
    );
  }

  function handleCancelEdit() {
    setToothReference(entry.toothReference ?? "");
    setQuantity(String(entry.quantity));
    setUnitPrice(String(entry.unitPrice));
    setNotes(entry.notes ?? "");
    setMode("view");
  }

  if (mode === "edit") {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <div className="flex flex-wrap items-end gap-3 py-1">
            <span className="min-w-32 text-sm font-medium text-foreground">{treatmentName}</span>
            <Input id={`tooth-${entry.id}`} label="Tooth" value={toothReference} onChange={(e) => setToothReference(e.target.value)} className="w-24" />
            <Input
              id={`qty-${entry.id}`}
              label="Qty"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20"
            />
            <Input
              id={`price-${entry.id}`}
              label="Unit Price"
              type="number"
              min={0}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-32"
            />
            <Input id={`notes-${entry.id}`} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-48" />
            <Button isLoading={updateTreatment.isPending} onClick={handleSave}>
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
          {updateTreatment.isError && (
            <p role="alert" className="mt-1 text-sm text-error">
              {getApiErrorMessage(updateTreatment.error)}
            </p>
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{treatmentName}</TableCell>
      <TableCell>{entry.toothReference ?? "-"}</TableCell>
      <TableCell>{entry.quantity}</TableCell>
      <TableCell>{formatCurrency(entry.unitPrice)}</TableCell>
      <TableCell>{formatCurrency(entry.subtotal)}</TableCell>
      <TableCell>
        {!readOnly && (
          <div className="flex flex-wrap gap-1.5">
            {mode === "confirmRemove" ? (
              <>
                <Button variant="danger" isLoading={removeTreatment.isPending} onClick={() => removeTreatment.mutate(entry.id)}>
                  Confirm Remove
                </Button>
                <Button type="button" variant="secondary" onClick={() => setMode("view")}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="tertiary" onClick={() => setMode("edit")}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setMode("confirmRemove")}>
                  Remove
                </Button>
              </>
            )}
          </div>
        )}
        {removeTreatment.isError && (
          <p role="alert" className="mt-1 text-xs text-error">
            {getApiErrorMessage(removeTreatment.error)}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

// docs/06-tasks/task-053.md: price is snapshotted server-side at entry
// time from the Treatment catalog, so unitPrice/subtotal shown in the
// table below reflect what was actually billed, not the current catalog
// price if it has since changed. docs/06-tasks/task-321.md: Edit does let
// staff subsequently correct Unit Price (an explicit, audited action) --
// this doesn't reintroduce automatic catalog-price recalculation.
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
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {treatmentEntries.map((entry) => (
              <TreatmentRow key={entry.id} visitId={visitId} entry={entry} treatmentName={treatmentName(entry.treatmentId)} readOnly={readOnly} />
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
