"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAllergies, useRecordAllergy } from "../hooks/usePatientClinicalData";
import { ALLERGY_SEVERITIES, ALLERGY_TYPES, AllergySeverity, AllergyType } from "../types/emr.types";
import { formatEnumLabel } from "../utils/formatEnumLabel";

const SEVERITY_TONE: Record<AllergySeverity, "warning" | "error" | "info"> = {
  MILD: "info",
  MODERATE: "warning",
  SEVERE: "error",
};

// docs/06-tasks/task-062.md: patient-safety-critical -- every recorded
// allergy is a hard input to AllergyCheckService, which task-065
// (Prescription) will consult before persisting a prescription.
export function AllergySection({ patientId, readOnly }: { patientId: string; readOnly: boolean }) {
  const { data: allergies, isLoading, isError, error, refetch } = useAllergies(patientId);
  const [type, setType] = useState<AllergyType>("DRUG");
  const [allergen, setAllergen] = useState("");
  const [severity, setSeverity] = useState<AllergySeverity>("MILD");
  const [reaction, setReaction] = useState("");
  const recordAllergy = useRecordAllergy(patientId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allergen.trim()) return;
    recordAllergy.mutate(
      { type, allergen, severity, reaction: reaction || undefined },
      { onSuccess: () => { setAllergen(""); setReaction(""); } },
    );
  }

  if (isLoading) return <LoadingState label="Loading allergies..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!allergies || allergies.length === 0 ? (
        <EmptyState title="No allergies recorded yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Allergen</TableHeaderCell>
              <TableHeaderCell>Severity</TableHeaderCell>
              <TableHeaderCell>Reaction</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allergies.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatEnumLabel(entry.type)}</TableCell>
                <TableCell>{entry.allergen}</TableCell>
                <TableCell>
                  <Badge tone={SEVERITY_TONE[entry.severity]}>{entry.severity}</Badge>
                </TableCell>
                <TableCell>{entry.reaction ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.allergy.record">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
            <Select id="allergyType" label="Type" value={type} onChange={(e) => setType(e.target.value as AllergyType)}>
              {ALLERGY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatEnumLabel(t)}
                </option>
              ))}
            </Select>
            <Input id="allergen" label="Allergen" value={allergen} onChange={(e) => setAllergen(e.target.value)} className="min-w-48" />
            <Select id="allergySeverity" label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value as AllergySeverity)}>
              {ALLERGY_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {formatEnumLabel(s)}
                </option>
              ))}
            </Select>
            <Input id="allergyReaction" label="Reaction" value={reaction} onChange={(e) => setReaction(e.target.value)} className="min-w-48" />
            <Button type="submit" isLoading={recordAllergy.isPending} disabled={!allergen.trim()}>
              Save Allergy
            </Button>
            {recordAllergy.isError && (
              <p role="alert" className="w-full text-sm text-error">
                {getApiErrorMessage(recordAllergy.error)}
              </p>
            )}
          </form>
        </PermissionGuard>
      )}
    </div>
  );
}
