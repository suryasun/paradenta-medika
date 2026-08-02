"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useIssueMedicalCertificate, usePatientMedicalCertificates } from "../hooks/useMedicalCertificate";
import { MEDICAL_CERTIFICATE_TYPES, MedicalCertificateType } from "../types/emr.types";

// docs/06-tasks/task-088.md: "Medical Certificate issuance form (type
// selection, details) within the Visit/EMR screen." Doctor-only creation is
// enforced by the backend (emr.certificate.issue); PermissionGuard here
// only hides the form for non-Doctor users, it does not itself enforce.
export function MedicalCertificateSection({ visitId, patientId, readOnly }: { visitId: string; patientId: string; readOnly: boolean }) {
  const { data: certificates, isLoading, isError, error, refetch } = usePatientMedicalCertificates(patientId);
  const [certificateType, setCertificateType] = useState<MedicalCertificateType>("FIT_TO_WORK");
  const [content, setContent] = useState("");
  const issueCertificate = useIssueMedicalCertificate(visitId, patientId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    issueCertificate.mutate({ certificateType, content }, { onSuccess: () => setContent("") });
  }

  if (isLoading) return <LoadingState label="Loading medical certificates..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!certificates || certificates.length === 0 ? (
        <EmptyState title="No medical certificates issued yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Certificate Number</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Content</TableHeaderCell>
              <TableHeaderCell>Issued At</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((certificate) => (
              <TableRow key={certificate.id}>
                <TableCell>{certificate.certificateNumber}</TableCell>
                <TableCell>{certificate.certificateType.replace(/_/g, " ")}</TableCell>
                <TableCell>{certificate.content}</TableCell>
                <TableCell>{new Date(certificate.issuedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.certificate.issue">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <Select
              id="certificateType"
              label="Certificate Type"
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value as MedicalCertificateType)}
              className="max-w-xs"
            >
              {MEDICAL_CERTIFICATE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
            <Textarea id="certificateContent" label="Content" value={content} onChange={(e) => setContent(e.target.value)} />
            <Button type="submit" isLoading={issueCertificate.isPending} disabled={!content.trim()} className="self-start">
              Issue Certificate
            </Button>
            {issueCertificate.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(issueCertificate.error)}
              </p>
            )}
          </form>
        </PermissionGuard>
      )}
    </div>
  );
}
