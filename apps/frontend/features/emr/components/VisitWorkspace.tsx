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
import { AllergySection } from "./AllergySection";
import { ClinicalAlertBanner } from "./ClinicalAlertBanner";
import { DiagnosisSection } from "./DiagnosisSection";
import { MedicalHistorySection } from "./MedicalHistorySection";
import { AttachmentSection } from "./AttachmentSection";
import { ConsentSection } from "./ConsentSection";
import { FollowUpSection } from "./FollowUpSection";
import { MedicalCertificateSection } from "./MedicalCertificateSection";
import { OdontogramSection } from "./OdontogramSection";
import { PeriodontalAssessmentSection } from "./PeriodontalAssessmentSection";
import { PrescriptionSection } from "./PrescriptionSection";
import { ReferralSection } from "./ReferralSection";
import { SoapNoteSection } from "./SoapNoteSection";
import { TreatmentPlanSection } from "./TreatmentPlanSection";
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

  // docs/06-tasks/task-318.md: COMPLETED no longer implies read-only -- only
  // LOCKED/ARCHIVED do (mirrors the backend's relaxed assertVisitOpen gate,
  // task-316.md). Whether "Close Visit" itself is offered is a separate
  // question (canClose, below) from whether the visit's sections are
  // editable (readOnly) -- a COMPLETED visit is editable but not re-closable.
  const readOnly = visit.status === "LOCKED" || visit.status === "ARCHIVED";
  const canClose = OPEN_VISIT_STATUSES.includes(visit.status);
  // docs/06-tasks/task-317.md: Treatment locks independently of the Visit's
  // own status, purely on the linked Invoice being PAID.
  const treatmentReadOnly = readOnly || visit.isTreatmentLocked;

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
        {canClose && (
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

      <ClinicalAlertBanner patientId={visit.patientId} />

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
            content: (
              <TreatmentSection
                visitId={visitId}
                treatmentEntries={visit.treatmentEntries}
                readOnly={treatmentReadOnly}
                isPaymentLocked={visit.isTreatmentLocked && !readOnly}
              />
            ),
          },
          {
            key: "medical-history",
            label: "Medical History",
            content: <MedicalHistorySection patientId={visit.patientId} readOnly={readOnly} />,
          },
          {
            key: "allergy",
            label: "Allergy",
            content: <AllergySection patientId={visit.patientId} readOnly={readOnly} />,
          },
          {
            key: "odontogram",
            label: "Odontogram",
            content: <OdontogramSection visitId={visitId} patientId={visit.patientId} readOnly={readOnly} />,
          },
          {
            key: "treatment-plan",
            label: "Treatment Plan",
            content: <TreatmentPlanSection visitId={visitId} readOnly={readOnly} />,
          },
          {
            key: "periodontal",
            label: "Periodontal",
            content: (
              <PeriodontalAssessmentSection visitId={visitId} patientId={visit.patientId} doctorId={visit.doctorId} readOnly={readOnly} />
            ),
          },
          {
            key: "referral",
            label: "Referral",
            content: <ReferralSection visitId={visitId} readOnly={readOnly} />,
          },
          {
            key: "follow-up",
            label: "Follow Up",
            content: <FollowUpSection visitId={visitId} readOnly={readOnly} />,
          },
          {
            key: "attachments",
            label: "Attachments",
            content: <AttachmentSection visitId={visitId} patientId={visit.patientId} readOnly={readOnly} />,
          },
          {
            key: "prescription",
            label: "Prescription",
            content: <PrescriptionSection visitId={visitId} patientId={visit.patientId} readOnly={readOnly} />,
          },
          {
            key: "consent",
            label: "Consent",
            content: <ConsentSection visitId={visitId} patientId={visit.patientId} readOnly={readOnly} />,
          },
          {
            key: "medical-certificate",
            label: "Medical Certificate",
            content: <MedicalCertificateSection visitId={visitId} patientId={visit.patientId} readOnly={readOnly} />,
          },
        ]}
      />
    </div>
  );
}
