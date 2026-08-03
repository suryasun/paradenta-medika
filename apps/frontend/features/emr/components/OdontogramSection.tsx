"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useToothConditions } from "@/features/master-data/hooks/useToothConditions";
import { ToothCondition } from "@/features/master-data/types/masterData.types";
import { useCurrentOdontogram, useRecordToothCondition, useToothHistory } from "../hooks/usePatientClinicalData";
import { OdontogramEntry } from "../types/emr.types";
import { OdontogramChart } from "./OdontogramChart";

// docs/02-design/design-system.md §11.5 / docs/02-design/pages/emr.md §10:
// this is the product's signature interactive element. The interactive
// FDI chart (OdontogramChart) is now the primary view, replacing the
// earlier table+form stand-in (task-068's own comment flagged that as a
// placeholder pending "its own follow-up UI-focused task" -- this is that
// task). The table remains as a "View as table" fallback, same pattern
// established for Recharts-backed reports elsewhere in this app, since
// it's still a genuinely useful accessible alternative to a spatial chart.
export function OdontogramSection({ visitId, patientId, readOnly }: { visitId: string; patientId: string; readOnly: boolean }) {
  const { data: entries, isLoading, isError, error, refetch } = useCurrentOdontogram(patientId);
  const { data: conditionsData } = useToothConditions();
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [historyTooth, setHistoryTooth] = useState<number | null>(null);
  const [view, setView] = useState<"chart" | "table">("chart");
  const recordToothCondition = useRecordToothCondition(visitId, patientId);

  const conditions = conditionsData?.items ?? [];
  const conditionName = (id: string) => conditions.find((c) => c.id === id)?.conditionName ?? id;

  if (isLoading) return <LoadingState label="Loading odontogram..." cards={8} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const entriesList = entries ?? [];
  const selectedEntry = selectedTooth !== null ? entriesList.find((e) => e.toothNumber === selectedTooth) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
          className="text-xs font-medium text-primary hover:underline"
        >
          {view === "chart" ? "View as table" : "View as chart"}
        </button>
      </div>

      {view === "chart" ? (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-2">
            {entriesList.length === 0 && (
              <p className="text-xs text-muted">No tooth conditions recorded yet — click any tooth below to record one.</p>
            )}
            <OdontogramChart entries={entriesList} conditions={conditions} selectedTooth={selectedTooth} onSelectTooth={setSelectedTooth} />
          </div>

          {selectedTooth !== null ? (
            <ToothPanel
              key={selectedTooth}
              toothNumber={selectedTooth}
              entry={selectedEntry}
              conditions={conditions}
              conditionName={conditionName}
              readOnly={readOnly}
              isSaving={recordToothCondition.isPending}
              saveError={recordToothCondition.isError ? getApiErrorMessage(recordToothCondition.error) : undefined}
              onRecord={(input) => recordToothCondition.mutate(input)}
              onViewHistory={() => setHistoryTooth(selectedTooth)}
              onClose={() => setSelectedTooth(null)}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
              Select a tooth to record a condition or view its history.
            </div>
          )}
        </div>
      ) : (
        <>
          {entriesList.length === 0 ? (
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
                {entriesList
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
        </>
      )}

      {historyTooth !== null && (
        <ToothHistoryModal patientId={patientId} toothNumber={historyTooth} conditionName={conditionName} onClose={() => setHistoryTooth(null)} />
      )}
    </div>
  );
}

interface ToothPanelProps {
  toothNumber: number;
  entry: OdontogramEntry | undefined;
  conditions: ToothCondition[];
  conditionName: (id: string) => string;
  readOnly: boolean;
  isSaving: boolean;
  saveError: string | undefined;
  onRecord: (input: { toothNumber: number; surface?: string; toothConditionId: string; note?: string }) => void;
  onViewHistory: () => void;
  onClose: () => void;
}

// The side panel for the currently selected tooth (docs/02-design/
// ui-guidelines.md §4: this benefits from staying visible while browsing
// the chart, so it's a panel, not a modal). Reuses the same Surface/
// Condition fields the old inline form had, plus a Note field --
// RecordToothConditionInput.note already existed in the type/API, it
// just wasn't exposed in the UI before this pass (no contract change).
function ToothPanel({ toothNumber, entry, conditions, conditionName, readOnly, isSaving, saveError, onRecord, onViewHistory, onClose }: ToothPanelProps) {
  const [surface, setSurface] = useState("");
  const [toothConditionId, setToothConditionId] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!toothConditionId) return;
    onRecord({ toothNumber, surface: surface || undefined, toothConditionId, note: note || undefined });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-foreground">Tooth {toothNumber}</h3>
        <button type="button" onClick={onClose} aria-label="Close tooth panel" className="text-sm text-muted hover:text-foreground">
          ✕
        </button>
      </div>

      <div className="text-sm text-foreground">{entry ? conditionName(entry.toothConditionId) : "No condition recorded"}</div>
      {entry?.surface && <div className="text-xs text-muted">Surface: {entry.surface}</div>}

      <button type="button" onClick={onViewHistory} className="self-start text-xs font-medium text-primary hover:underline">
        View History
      </button>

      {!readOnly && (
        <PermissionGuard permission="emr.odontogram.record">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-border pt-3">
            <Input id="surface" label="Surface (e.g. O, MO, MOD)" value={surface} onChange={(e) => setSurface(e.target.value)} />
            <Select id="toothConditionId" label="Condition" value={toothConditionId} onChange={(e) => setToothConditionId(e.target.value)} required>
              <option value="">Select a condition</option>
              {conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.conditionName}
                </option>
              ))}
            </Select>
            <Textarea id="note" label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" isLoading={isSaving} disabled={!toothConditionId}>
              Save
            </Button>
            {saveError && (
              <p role="alert" className="text-sm text-error">
                {saveError}
              </p>
            )}
          </form>
        </PermissionGuard>
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
      {isLoading && <LoadingState label="Loading history..." rows={3} columns={2} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} />}
      {!isLoading && !isError && (!history || history.length === 0) && <EmptyState title="No history for this tooth" />}
      {!isLoading && !isError && history && history.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {history.map((entry) => (
            <li key={entry.id} className="rounded-md border border-border p-2">
              <span className="font-medium">{conditionName(entry.toothConditionId)}</span>
              {entry.surface && <span className="text-muted"> ({entry.surface})</span>}
              {entry.note && <span className="mt-1 block text-xs text-foreground">{entry.note}</span>}
              <span className="block text-xs text-muted">{new Date(entry.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
