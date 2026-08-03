"use client";

import { FormEvent, useRef, useState } from "react";
import { Eraser, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
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
import { useConsentTemplates } from "@/features/master-data/hooks/useConsentTemplates";
import { useCreateConsent, usePatientConsents, useSignConsent } from "../hooks/useConsent";
import { CONSENT_SIGNER_RELATIONSHIPS, Consent, ConsentSignerRelationship } from "../types/emr.types";

// docs/06-tasks/task-086.md: "an e-signature capture UI (drawn signature or
// typed + confirmation) is required; exact UX is not specified in the
// SAD." Implemented as a plain <canvas> draw pad (no new library), captured
// via toDataURL() -- a minimal but functional Digital Signature per
// docs/03-sad Part 3.3D Section 40's "Supported Signature Types"
// (Finger/Stylus/Mouse Signature).
export function ConsentSection({ visitId, patientId, readOnly }: { visitId: string; patientId: string; readOnly: boolean }) {
  const { data: consents, isLoading, isError, error, refetch } = usePatientConsents(patientId);
  const { data: templatesData } = useConsentTemplates();
  const [templateId, setTemplateId] = useState("");
  const [procedure, setProcedure] = useState("");
  const [signingConsentId, setSigningConsentId] = useState<string | null>(null);
  const createConsent = useCreateConsent(patientId);

  const activeTemplates = templatesData?.items.filter((t) => t.isActive) ?? [];
  const templateTitle = (id: string) => templatesData?.items.find((t) => t.id === id)?.title ?? id;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!templateId || !procedure.trim()) return;
    createConsent.mutate({ visitId, templateId, procedure }, { onSuccess: () => setProcedure("") });
  }

  if (isLoading) return <LoadingState label="Loading consents..." rows={3} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!consents || consents.length === 0 ? (
        <EmptyState
          title="No consents recorded yet"
          description={!readOnly ? "Use the form below to create the first consent for this patient." : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Template</TableHeaderCell>
              <TableHeaderCell>Procedure</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Signer</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consents.map((consent: Consent) => (
              <TableRow key={consent.id}>
                <TableCell>{templateTitle(consent.templateId)}</TableCell>
                <TableCell>{consent.procedure}</TableCell>
                <TableCell>
                  <Badge tone={consent.signedAt ? "success" : "warning"}>{consent.signedAt ? "Signed" : "Draft"}</Badge>
                </TableCell>
                <TableCell>{consent.signerName ?? "-"}</TableCell>
                <TableCell>
                  {!consent.signedAt && !readOnly && (
                    <PermissionGuard permission="emr.consent.sign">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        onClick={() => setSigningConsentId(consent.id)}
                      >
                        <PenLine size={13} strokeWidth={1.75} aria-hidden="true" />
                        Sign
                      </button>
                    </PermissionGuard>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.consent.create">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
            <Select id="consentTemplateId" label="Consent Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="min-w-64">
              <option value="">Select a template</option>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title} ({template.category})
                </option>
              ))}
            </Select>
            <Input id="consentProcedure" label="Procedure" value={procedure} onChange={(e) => setProcedure(e.target.value)} className="min-w-48" />
            <Button type="submit" isLoading={createConsent.isPending} disabled={!templateId || !procedure.trim()}>
              Create Consent
            </Button>
            {createConsent.isError && (
              <p role="alert" className="w-full text-sm text-error">
                {getApiErrorMessage(createConsent.error)}
              </p>
            )}
          </form>
        </PermissionGuard>
      )}

      {signingConsentId && <SignConsentModal patientId={patientId} consentId={signingConsentId} onClose={() => setSigningConsentId(null)} />}
    </div>
  );
}

function SignConsentModal({ patientId, consentId, onClose }: { patientId: string; consentId: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [signerName, setSignerName] = useState("");
  const [signerRelationship, setSignerRelationship] = useState<ConsentSignerRelationship>("SELF");
  const [hasDrawn, setHasDrawn] = useState(false);
  const signConsent = useSignConsent(patientId);

  function getContext() {
    const canvas = canvasRef.current;
    return canvas?.getContext("2d") ?? null;
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = getContext();
    if (!ctx) return;
    drawingRef.current = true;
    const rect = event.currentTarget.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const rect = event.currentTarget.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  }

  function endDraw() {
    drawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!signerName.trim() || !hasDrawn || !canvas) return;
    const signatureData = canvas.toDataURL("image/png");
    signConsent.mutate({ consentId, payload: { signerName, signerRelationship, signatureData } }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title="Sign Consent" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="signerName" label="Signer Name" value={signerName} onChange={(e) => setSignerName(e.target.value)} required />
        <Select
          id="signerRelationship"
          label="Relationship"
          value={signerRelationship}
          onChange={(e) => setSignerRelationship(e.target.value as ConsentSignerRelationship)}
        >
          {CONSENT_SIGNER_RELATIONSHIPS.map((relationship) => (
            <option key={relationship} value={relationship}>
              {relationship}
            </option>
          ))}
        </Select>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Signature</span>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="touch-none rounded-md border border-border bg-white"
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
          />
          <Button type="button" variant="secondary" onClick={clearCanvas} className="self-start">
            <Eraser size={14} strokeWidth={1.75} aria-hidden="true" />
            Clear
          </Button>
        </div>
        {signConsent.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(signConsent.error)}
          </p>
        )}
        <Button type="submit" isLoading={signConsent.isPending} disabled={!signerName.trim() || !hasDrawn}>
          Confirm Signature
        </Button>
      </form>
    </Modal>
  );
}
