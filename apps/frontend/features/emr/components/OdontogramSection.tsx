"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useToothConditions } from "@/features/master-data/hooks/useToothConditions";
import { useCurrentOdontogram, useRecordToothCondition, useToothHistory } from "../hooks/usePatientClinicalData";
import { FDI_TOOTH_NUMBERS } from "../types/emr.types";

// docs/06-tasks/task-068.md flags that the full Interactive Odontogram SVG
// (Tooth SVG, Surface Overlay, Context Menu, etc. per docs/03-sad/
// 15-module-emr.md Section 31) "likely warrants its own follow-up UI-focused
// task if the SVG interaction complexity exceeds one session" -- this is a
// functional table/form equivalent covering the same API surface
// (record/current-state/history), not the visual tooth-diagram affordance.
export function OdontogramSection({ visitId, patientId, readOnly }: { visitId: string; patientId: string; readOnly: boolean }) {
  const { data: entries, isLoading, isError, error, refetch } = useCurrentOdontogram(patientId);
  const { data: conditionsData } = useToothConditions();
  const [toothNumber, setToothNumber] = useState<number>(FDI_TOOTH_NUMBERS[0]);
  const [surface, setSurface] = useState("");
  const [toothConditionId, setToothConditionId] = useState("");
  const [historyTooth, setHistoryTooth] = useState<number | null>(null);
  const recordToothCondition = useRecordToothCondition(visitId, patientId);

  const conditionName = (id: string) => conditionsData?.items.find((c) => c.id === id)?.conditionName ?? id;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!toothConditionId) return;
    recordToothCondition.mutate(
      { toothNumber, surface: surface || undefined, toothConditionId },
      { onSuccess: () => setSurface("") },
    );
  }

  if (isLoading) return <LoadingState label="Loading odontogram..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!entries || entries.length === 0 ? (
        <EmptyState title="No tooth conditions recorded yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tooth</TableHeaderCell>
              <TableHeaderCell>Surface</TableHeaderCell>
              <TableHeaderCell>Condition</TableHeaderCell>
              <TableHeaderCell>History</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries
              .slice()
              .sort((a, b) => a.toothNumber - b.toothNumber)
              .map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.toothNumber}</TableCell>
                  <TableCell>{entry.surface ?? "-"}</TableCell>
                  <TableCell>{conditionName(entry.toothConditionId)}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={() => setHistoryTooth(entry.toothNumber)}
                    >
                      View History
                    </button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.odontogram.record">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
            <Select id="toothNumber" label="Tooth (FDI)" value={toothNumber} onChange={(e) => setToothNumber(Number(e.target.value))}>
              {FDI_TOOTH_NUMBERS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Input id="surface" label="Surface (e.g. O, MO, MOD)" value={surface} onChange={(e) => setSurface(e.target.value)} className="min-w-40" />
            <Select
              id="toothConditionId"
              label="Condition"
              value={toothConditionId}
              onChange={(e) => setToothConditionId(e.target.value)}
              required
              className="min-w-64"
            >
              <option value="">Select a condition</option>
              {conditionsData?.items.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.conditionName}
                </option>
              ))}
            </Select>
            <Button type="submit" isLoading={recordToothCondition.isPending} disabled={!toothConditionId}>
              Save
            </Button>
            {recordToothCondition.isError && (
              <p role="alert" className="w-full text-sm text-error">
                {getApiErrorMessage(recordToothCondition.error)}
              </p>
            )}
          </form>
        </PermissionGuard>
      )}

      {historyTooth !== null && (
        <ToothHistoryModal patientId={patientId} toothNumber={historyTooth} conditionName={conditionName} onClose={() => setHistoryTooth(null)} />
      )}
    </div>
  );
}

function ToothHistoryModal({
  patientId,
  toothNumber,
  conditionName,
  onClose,
}: {
  patientId: string;
  toothNumber: number;
  conditionName: (id: string) => string;
  onClose: () => void;
}) {
  const { data: history, isLoading, isError, error } = useToothHistory(patientId, toothNumber);

  return (
    <Modal title={`Tooth ${toothNumber} History`} onClose={onClose}>
      {isLoading && <LoadingState label="Loading history..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} />}
      {!isLoading && !isError && (!history || history.length === 0) && <EmptyState title="No history for this tooth" />}
      {!isLoading && !isError && history && history.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {history.map((entry) => (
            <li key={entry.id} className="rounded-md border border-border p-2">
              <span className="font-medium">{conditionName(entry.toothConditionId)}</span>
              {entry.surface && <span className="text-muted"> ({entry.surface})</span>}
              <span className="block text-xs text-muted">{new Date(entry.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
