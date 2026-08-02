"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRecordDiagnoses } from "../hooks/useVisitMutations";
import { Diagnosis, DiagnosisEntryInput, DiagnosisType } from "../types/emr.types";

const DIAGNOSIS_TYPES: DiagnosisType[] = ["PRIMARY", "SECONDARY", "DIFFERENTIAL"];

// docs/06-tasks/task-051.md: each POST /diagnoses call requires at least
// one PRIMARY entry within that same batch (apps/backend's
// RecordDiagnosisUseCase checks the submitted array, not the visit's
// running total) -- entries are staged locally and submitted together.
export function DiagnosisSection({ visitId, diagnoses, readOnly }: { visitId: string; diagnoses: Diagnosis[]; readOnly: boolean }) {
  const [pending, setPending] = useState<DiagnosisEntryInput[]>([]);
  const [diagnosisType, setDiagnosisType] = useState<DiagnosisType>("PRIMARY");
  const [diagnosisName, setDiagnosisName] = useState("");
  const recordDiagnoses = useRecordDiagnoses(visitId);

  function addPending() {
    if (!diagnosisName.trim()) return;
    setPending((prev) => [...prev, { diagnosisType, diagnosisName }]);
    setDiagnosisName("");
  }

  function submitPending() {
    recordDiagnoses.mutate(pending, { onSuccess: () => setPending([]) });
  }

  const hasPrimary = pending.some((entry) => entry.diagnosisType === "PRIMARY");

  return (
    <div className="flex flex-col gap-4">
      {diagnoses.length === 0 ? (
        <EmptyState title="No diagnoses recorded yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Diagnosis</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {diagnoses.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Badge tone={d.diagnosisType === "PRIMARY" ? "info" : "neutral"}>{d.diagnosisType}</Badge>
                </TableCell>
                <TableCell>{d.diagnosisName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Select id="diagnosisType" label="Type" value={diagnosisType} onChange={(e) => setDiagnosisType(e.target.value as DiagnosisType)}>
              {DIAGNOSIS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Input id="diagnosisName" label="Diagnosis Name" value={diagnosisName} onChange={(e) => setDiagnosisName(e.target.value)} className="min-w-64" />
            <Button type="button" variant="secondary" onClick={addPending}>
              Add
            </Button>
          </div>

          {pending.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {pending.map((entry, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Badge tone={entry.diagnosisType === "PRIMARY" ? "info" : "neutral"}>{entry.diagnosisType}</Badge>
                  {entry.diagnosisName}
                </li>
              ))}
            </ul>
          )}

          {pending.length > 0 && !hasPrimary && (
            <p className="text-sm text-warning">At least one Primary Diagnosis is required before saving.</p>
          )}
          {recordDiagnoses.isError && (
            <p role="alert" className="text-sm text-error">
              {getApiErrorMessage(recordDiagnoses.error)}
            </p>
          )}
          <Button
            type="button"
            isLoading={recordDiagnoses.isPending}
            disabled={pending.length === 0 || !hasPrimary}
            onClick={submitPending}
            className="self-start"
          >
            Save Diagnoses
          </Button>
        </div>
      )}
    </div>
  );
}
