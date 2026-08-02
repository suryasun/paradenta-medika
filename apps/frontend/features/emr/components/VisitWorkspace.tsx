"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Tabs } from "@/components/ui/Tabs";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useVisit } from "../hooks/useVisit";
import { useCloseVisit } from "../hooks/useVisitMutations";
import { OPEN_VISIT_STATUSES } from "../types/emr.types";
import { DiagnosisSection } from "./DiagnosisSection";
import { SoapNoteSection } from "./SoapNoteSection";
import { TreatmentSection } from "./TreatmentSection";
import { VitalSignSection } from "./VitalSignSection";

const VISIT_STATUS_TONE = {
  DRAFT: "neutral",
  WAITING_EXAMINATION: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  LOCKED: "success",
  ARCHIVED: "neutral",
} as const;

// docs/06-tasks/task-048.md..task-053.md. This is the doctor's chairside
// workspace: no visit list endpoint exists in Phase 1 (see
// features/emr/services/emr.service.ts) -- a Visit is always opened
// directly from a CALLED Queue entry and this page is reached from there.
export function VisitWorkspace({ visitId }: { visitId: string }) {
  const { data: visit, isLoading, isError, error, refetch } = useVisit(visitId);
  const closeVisit = useCloseVisit(visitId);

  if (isLoading) return <LoadingState label="Loading visit..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!visit) return null;

  const readOnly = !OPEN_VISIT_STATUSES.includes(visit.status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Visit {visit.visitNo}</h1>
          <p className="text-sm text-muted">
            <Badge tone={VISIT_STATUS_TONE[visit.status]}>{visit.status}</Badge>
            {visit.chiefComplaint && <span className="ml-2">{visit.chiefComplaint}</span>}
          </p>
        </div>
        {!readOnly && (
          <PermissionGuard permission="emr.visit.close">
            <Button variant="danger" isLoading={closeVisit.isPending} onClick={() => closeVisit.mutate()}>
              Close Visit
            </Button>
          </PermissionGuard>
        )}
      </div>

      {closeVisit.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(closeVisit.error)}
        </p>
      )}

      <Tabs
        items={[
          {
            key: "vitals",
            label: "Vital Signs",
            content: <VitalSignSection visitId={visitId} vitalSigns={visit.vitalSigns} readOnly={readOnly} />,
          },
          {
            key: "soap",
            label: "SOAP Note",
            content: <SoapNoteSection visitId={visitId} soapNote={visit.soapNote} readOnly={readOnly} />,
          },
          {
            key: "diagnosis",
            label: "Diagnosis",
            content: <DiagnosisSection visitId={visitId} diagnoses={visit.diagnoses} readOnly={readOnly} />,
          },
          {
            key: "treatment",
            label: "Treatment",
            content: <TreatmentSection visitId={visitId} treatmentEntries={visit.treatmentEntries} readOnly={readOnly} />,
          },
        ]}
      />
    </div>
  );
}
