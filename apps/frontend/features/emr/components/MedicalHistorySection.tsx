"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useMedicalHistory, useRecordMedicalHistory } from "../hooks/usePatientClinicalData";
import { MEDICAL_HISTORY_CATEGORIES, MedicalHistoryCategory } from "../types/emr.types";
import { formatEnumLabel } from "../utils/formatEnumLabel";

// docs/06-tasks/task-061.md: only the currently-active entry per category is
// shown -- recording a new entry for the same category supersedes the prior
// one (the full change history is retained server-side, not surfaced here).
export function MedicalHistorySection({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data: history, isLoading, isError, error, refetch } = useMedicalHistory(patientId);
  const [category, setCategory] = useState<MedicalHistoryCategory>("SYSTEMIC_DISEASE");
  const [description, setDescription] = useState("");
  const recordMedicalHistory = useRecordMedicalHistory(patientId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!description.trim()) return;
    recordMedicalHistory.mutate({ category, description }, { onSuccess: () => setDescription("") });
  }

  if (isLoading) return <LoadingState label="Loading medical history..." rows={3} columns={2} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!history || history.length === 0 ? (
        <EmptyState
          title="No medical history recorded yet"
          description={!readOnly ? "Use the form below to record the first entry." : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatEnumLabel(entry.category)}</TableCell>
                <TableCell>{entry.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.medical-history.record">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Select
                id="medicalHistoryCategory"
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicalHistoryCategory)}
                className="min-w-64"
              >
                {MEDICAL_HISTORY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {formatEnumLabel(c)}
                  </option>
                ))}
              </Select>
            </div>
            <Textarea
              id="medicalHistoryDescription"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {recordMedicalHistory.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(recordMedicalHistory.error)}
              </p>
            )}
            <Button type="submit" isLoading={recordMedicalHistory.isPending} disabled={!description.trim()} className="self-start">
              <Save size={14} strokeWidth={1.75} aria-hidden="true" />
              Save Medical History
            </Button>
          </form>
        </PermissionGuard>
      )}
    </div>
  );
}
