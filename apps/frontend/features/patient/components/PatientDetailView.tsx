"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { InlineEditableCell } from "@/components/ui/InlineEditableCell";
import { LoadingState } from "@/components/ui/LoadingState";
import { Tabs } from "@/components/ui/Tabs";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { useAuthStore } from "@/stores/auth.store";
import { getApiErrorMessage } from "@/lib/api-client";
import { ClinicalTimelineSection } from "@/features/emr/components/ClinicalTimelineSection";
import { useReferralSources } from "@/features/master-data/hooks/useReferralSources";
import { usePatient } from "../hooks/usePatient";
import { useArchivePatient, useRestorePatient } from "../hooks/usePatientMutations";
import { patientService } from "../services/patient.service";
import { UpdatePatientInput } from "../types/patient.types";
import { PatientAddressList } from "./PatientAddressList";
import { PatientEmergencyContactList } from "./PatientEmergencyContactList";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value || "-"}</dd>
    </div>
  );
}

// docs/02-design/pages/patient.md §13: inline edit for simple profile
// fields instead of a full Edit-Patient round-trip for a one-field
// correction. Scoped exactly to UpdatePatientInput's actual fields
// (fullName/phoneNumber/email/address) -- gender/DOB/place-of-birth
// aren't in that DTO and stay read-only, since the API contract is frozen.
function EditableField({
  label,
  value,
  patientId,
  field,
}: {
  label: string;
  value: string | null | undefined;
  patientId: string;
  field: keyof UpdatePatientInput;
}) {
  const canEdit = useAuthStore((s) => s.hasPermission("patient.update"));
  const queryClient = useQueryClient();

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-foreground">
        <InlineEditableCell
          value={value || ""}
          disabled={!canEdit}
          aria-label={label}
          onCommit={async (nextValue) => {
            await patientService.update(patientId, { [field]: String(nextValue) });
            await queryClient.invalidateQueries({ queryKey: ["patients", "detail", patientId] });
          }}
        />
      </dd>
    </div>
  );
}

// docs/02-design/pages/patient.md Section 12.2 "Patient Detail Tabs".
// Reservation/Payment History are wired to real data sources (arrays on
// PatientDetailResponseDto) but always render empty in Phase 1 -- see
// features/patient/types/patient.types.ts for why. Visit History is
// replaced by the Clinical Timeline tab (docs/06-tasks/task-091.md:
// "replacing/extending the generic history tabs ... with a unified
// chronological feed"), which aggregates Visit plus every other Phase 2
// EMR event type via GET /emr/timeline/{patientId}. Emergency Contact is
// now real (task-288, Epic PE5). Attachments, Audit Trail, and Merge
// Patient still have no Phase 1 API and are not included.
export function PatientDetailView({ patientId }: { patientId: string }) {
  const { data: patient, isLoading, isError, error, refetch } = usePatient(patientId);
  const archivePatient = useArchivePatient();
  const restorePatient = useRestorePatient();
  const { data: referralSources } = useReferralSources();

  if (isLoading) return <LoadingState label="Loading patient..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!patient) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground">{patient.profile.fullName}</h1>
          <p className="text-sm text-muted">
            MRN {patient.medicalRecordNumber} · <Badge tone={patient.profile.status === "ACTIVE" ? "success" : "neutral"}>{patient.profile.status}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="patient.update">
            <Link href={`/patients/${patientId}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
          </PermissionGuard>
          <PermissionGuard permission="patient.archive">
            {patient.profile.status === "ACTIVE" ? (
              <Button variant="danger" isLoading={archivePatient.isPending} onClick={() => archivePatient.mutate(patientId)}>
                Archive
              </Button>
            ) : (
              <Button isLoading={restorePatient.isPending} onClick={() => restorePatient.mutate(patientId)}>
                Restore
              </Button>
            )}
          </PermissionGuard>
        </div>
      </div>

      <Tabs
        items={[
          {
            key: "profile",
            label: "Profile",
            content: (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <EditableField label="Full Name" value={patient.profile.fullName} patientId={patientId} field="fullName" />
                <Field label="Gender" value={patient.profile.gender === "MALE" ? "Male" : "Female"} />
                <Field label="Date of Birth" value={patient.profile.dateOfBirth} />
                <Field label="Place of Birth" value={patient.profile.placeOfBirth} />
                <EditableField label="Phone" value={patient.profile.phoneNumber} patientId={patientId} field="phoneNumber" />
                <EditableField label="Email" value={patient.profile.email} patientId={patientId} field="email" />

                {/* task-284 (Epic PE1): "Kontak Tambahan" sub-heading per
                    docs/02-design/pages/patient.md §14. */}
                <div className="col-span-full mt-2 border-t border-border pt-4 text-sm font-medium text-foreground">
                  Kontak Tambahan
                </div>
                <EditableField
                  label="Insurance Number"
                  value={patient.profile.insuranceNumber}
                  patientId={patientId}
                  field="insuranceNumber"
                />
                <EditableField
                  label="WhatsApp Number"
                  value={patient.profile.whatsappNumber}
                  patientId={patientId}
                  field="whatsappNumber"
                />
                <EditableField
                  label="Instagram Handle"
                  value={patient.profile.instagramHandle}
                  patientId={patientId}
                  field="instagramHandle"
                />
                <EditableField
                  label="Facebook Handle"
                  value={patient.profile.facebookHandle}
                  patientId={patientId}
                  field="facebookHandle"
                />
                <EditableField
                  label="TikTok Handle"
                  value={patient.profile.tiktokHandle}
                  patientId={patientId}
                  field="tiktokHandle"
                />

                {/* task-287 (Epic PE4): read-only here -- edited via the
                    Edit Patient form's dropdown, not inline (a Select
                    isn't one of InlineEditableCell's supported inputs). */}
                <Field
                  label="Referral Source"
                  value={referralSources?.find((source) => source.id === patient.profile.referralSourceId)?.referralSourceName}
                />
              </dl>
            ),
          },
          {
            key: "identity",
            label: "Identity",
            content: (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Identity Type" value={patient.identity.identityType} />
                <Field label="Identity Number" value={patient.identity.identityNumber} />
              </dl>
            ),
          },
          {
            key: "address",
            label: "Address",
            content: <PatientAddressList patientId={patientId} />,
          },
          {
            key: "emergency-contacts",
            label: "Emergency Contact",
            content: <PatientEmergencyContactList patientId={patientId} />,
          },
          {
            key: "reservations",
            label: "Reservation History",
            content: <EmptyState title="No reservation history" description="Not yet available for this patient." />,
          },
          {
            key: "clinical-timeline",
            label: "Clinical Timeline",
            content: <ClinicalTimelineSection patientId={patientId} />,
          },
          {
            key: "payments",
            label: "Payment History",
            content: <EmptyState title="No payment history" description="Not yet available for this patient." />,
          },
        ]}
      />
    </div>
  );
}
