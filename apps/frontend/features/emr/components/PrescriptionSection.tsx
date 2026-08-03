"use client";

import { useState } from "react";
import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCreatePrescription, usePrescriptionHistory, usePrescriptionPrint } from "../hooks/usePrescription";
import { Prescription, PrescriptionItemEntryInput } from "../types/emr.types";

const emptyItem: PrescriptionItemEntryInput = { medicineName: "", dosage: "", frequency: "", duration: "", instruction: "" };

// docs/06-tasks/task-065.md/task-066.md. "Medicine search/select" degrades
// to a plain text field: no task in Phase 1/2 builds Medicine master data
// (deferred to the not-yet-built Warehouse module, per explicit sign-off --
// see apps/backend prisma schema note on PrescriptionItem).
export function PrescriptionSection({ visitId, patientId, readOnly }: { visitId: string; patientId: string; readOnly: boolean }) {
  const { data: history, isLoading, isError, error, refetch } = usePrescriptionHistory(patientId);
  const [pending, setPending] = useState<PrescriptionItemEntryInput[]>([]);
  const [draft, setDraft] = useState<PrescriptionItemEntryInput>(emptyItem);
  const [printPrescriptionId, setPrintPrescriptionId] = useState<string | null>(null);
  const createPrescription = useCreatePrescription(visitId, patientId);

  function addPending() {
    if (!draft.medicineName.trim() || !draft.dosage.trim() || !draft.frequency.trim() || !draft.duration.trim()) return;
    setPending((prev) => [...prev, { ...draft, instruction: draft.instruction || undefined }]);
    setDraft(emptyItem);
  }

  function submitPending() {
    createPrescription.mutate(pending, { onSuccess: () => setPending([]) });
  }

  if (isLoading) return <LoadingState label="Loading prescription history..." rows={3} columns={3} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!history || history.length === 0 ? (
        <EmptyState
          title="No prescriptions recorded yet"
          description={!readOnly ? "Use the form below to build and save the first prescription." : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Medicines</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((prescription: Prescription) => (
              <TableRow key={prescription.id}>
                <TableCell>{new Date(prescription.createdAt).toLocaleString()}</TableCell>
                <TableCell>{prescription.items.map((item) => item.medicineName).join(", ")}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    onClick={() => setPrintPrescriptionId(prescription.id)}
                  >
                    <Printer size={13} strokeWidth={1.75} aria-hidden="true" />
                    Print
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.prescription.create">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Input
                id="medicineName"
                label="Medicine"
                value={draft.medicineName}
                onChange={(e) => setDraft((d) => ({ ...d, medicineName: e.target.value }))}
                className="min-w-48"
              />
              <Input id="dosage" label="Dosage" value={draft.dosage} onChange={(e) => setDraft((d) => ({ ...d, dosage: e.target.value }))} className="min-w-32" />
              <Input
                id="frequency"
                label="Frequency"
                value={draft.frequency}
                onChange={(e) => setDraft((d) => ({ ...d, frequency: e.target.value }))}
                className="min-w-32"
              />
              <Input
                id="duration"
                label="Duration"
                value={draft.duration}
                onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
                className="min-w-32"
              />
              <Button type="button" variant="secondary" onClick={addPending}>
                <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                Add
              </Button>
            </div>
            <Textarea
              id="instruction"
              label="Instruction (optional)"
              value={draft.instruction}
              onChange={(e) => setDraft((d) => ({ ...d, instruction: e.target.value }))}
            />

            {pending.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm">
                {pending.map((item, index) => (
                  <li key={index}>
                    {item.medicineName} — {item.dosage}, {item.frequency}, {item.duration}
                    {item.instruction ? ` (${item.instruction})` : ""}
                  </li>
                ))}
              </ul>
            )}

            {createPrescription.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(createPrescription.error)}
              </p>
            )}
            <Button
              type="button"
              isLoading={createPrescription.isPending}
              disabled={pending.length === 0}
              onClick={submitPending}
              className="self-start"
            >
              Save Prescription
            </Button>
          </div>
        </PermissionGuard>
      )}

      {printPrescriptionId && <PrescriptionPrintModal prescriptionId={printPrescriptionId} onClose={() => setPrintPrescriptionId(null)} />}
    </div>
  );
}

function PrescriptionPrintModal({ prescriptionId, onClose }: { prescriptionId: string; onClose: () => void }) {
  const { data: printData, isLoading, isError, error } = usePrescriptionPrint(prescriptionId);

  return (
    <Modal title="Prescription" onClose={onClose}>
      {isLoading && <LoadingState label="Loading prescription..." rows={3} columns={5} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} />}
      {printData && (
        <div className="flex flex-col gap-4">
          <div id="prescription-print-area" className="flex flex-col gap-2 text-sm">
            <p>
              <span className="font-medium">Patient:</span> {printData.patientName}
            </p>
            <p>
              <span className="font-medium">Doctor:</span> {printData.doctorName}
            </p>
            <p>
              <span className="font-medium">Date:</span> {new Date(printData.createdAt).toLocaleString()}
            </p>
            <table className="mt-2 w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="border-b border-border pb-1">Medicine</th>
                  <th className="border-b border-border pb-1">Dosage</th>
                  <th className="border-b border-border pb-1">Frequency</th>
                  <th className="border-b border-border pb-1">Duration</th>
                  <th className="border-b border-border pb-1">Instruction</th>
                </tr>
              </thead>
              <tbody>
                {printData.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1">{item.medicineName}</td>
                    <td className="py-1">{item.dosage}</td>
                    <td className="py-1">{item.frequency}</td>
                    <td className="py-1">{item.duration}</td>
                    <td className="py-1">{item.instruction ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" onClick={() => window.print()} className="self-start">
            <Printer size={14} strokeWidth={1.75} aria-hidden="true" />
            Print
          </Button>
        </div>
      )}
    </Modal>
  );
}
