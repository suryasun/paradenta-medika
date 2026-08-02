"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Tabs } from "@/components/ui/Tabs";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { usePatient } from "../hooks/usePatient";
import { useArchivePatient, useRestorePatient } from "../hooks/usePatientMutations";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value || "-"}</dd>
    </div>
  );
}

// docs/02-design/pages/patient.md Section 12.2 "Patient Detail Tabs".
// Reservation/Visit/Payment History are wired to real data sources (arrays
// on PatientDetailResponseDto) but always render empty in Phase 1 -- see
// features/patient/types/patient.types.ts for why. Emergency Contact,
// Attachments, Audit Trail, and Merge Patient have no Phase 1 API and are
// not included.
export function PatientDetailView({ patientId }: { patientId: string }) {
  const { data: patient, isLoading, isError, error, refetch } = usePatient(patientId);
  const archivePatient = useArchivePatient();
  const restorePatient = useRestorePatient();

  if (isLoading) return <LoadingState label="Loading patient..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!patient) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{patient.profile.fullName}</h1>
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
                <Field label="Full Name" value={patient.profile.fullName} />
                <Field label="Gender" value={patient.profile.gender === "MALE" ? "Male" : "Female"} />
                <Field label="Date of Birth" value={patient.profile.dateOfBirth} />
                <Field label="Place of Birth" value={patient.profile.placeOfBirth} />
                <Field label="Phone" value={patient.profile.phoneNumber} />
                <Field label="Email" value={patient.profile.email} />
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
            content: <p className="text-sm text-foreground">{patient.addresses[0] || "-"}</p>,
          },
          {
            key: "reservations",
            label: "Reservation History",
            content: <EmptyState title="No reservation history" description="Not yet available for this patient." />,
          },
          {
            key: "visits",
            label: "Visit History",
            content: <EmptyState title="No visit history" description="Not yet available for this patient." />,
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
