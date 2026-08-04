"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { branchService } from "../services/branch.service";
import { clinicService } from "../services/clinic.service";
import { useMasterDataTemplate, useTemplateDrift } from "../hooks/useMasterDataTemplates";
import { usePushMasterDataTemplate, useUpdateMasterDataTemplate } from "../hooks/useMasterDataTemplateMutations";
import { TemplatePushStatus } from "../types/masterData.types";

const PUSH_STATUS_TONE: Record<TemplatePushStatus, "success" | "info" | "warning"> = {
  CREATED: "success",
  UPDATED: "info",
  CONFLICT: "warning",
};

// Phase 4, task-221/222/223 (docs/02-design/pages/master-data.md §10.3).
export function MasterDataTemplateDetailPage({ templateId }: { templateId: string }) {
  const { data: template, isLoading, isError, error, refetch } = useMasterDataTemplate(templateId);
  const { data: clinicsData } = useQuery({ queryKey: ["master-data", "clinics", "options"], queryFn: () => clinicService.list() });
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: driftEntries, isLoading: driftLoading, isError: driftIsError, error: driftError } = useTemplateDrift(templateId);

  const updateTemplate = useUpdateMasterDataTemplate(templateId);
  const pushTemplate = usePushMasterDataTemplate(templateId);

  const [isEditing, setIsEditing] = useState(false);
  const [payloadText, setPayloadText] = useState("");
  const [syncedTemplate, setSyncedTemplate] = useState(template);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  if (template && template !== syncedTemplate) {
    setSyncedTemplate(template);
    if (!isEditing) {
      setPayloadText(JSON.stringify(template.templatePayload, null, 2));
    }
  }

  const [showPush, setShowPush] = useState(false);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  function startEdit() {
    if (template) setPayloadText(JSON.stringify(template.templatePayload, null, 2));
    setPayloadError(null);
    setIsEditing(true);
  }

  function submitEdit() {
    let templatePayload: Record<string, unknown>;
    try {
      templatePayload = JSON.parse(payloadText);
    } catch {
      setPayloadError("Template payload must be valid JSON.");
      return;
    }
    setPayloadError(null);
    updateTemplate.mutate(templatePayload, { onSuccess: () => setIsEditing(false) });
  }

  function toggleBranch(branchId: string) {
    setSelectedBranchIds((prev) => (prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]));
  }

  if (isLoading) return <LoadingState label="Loading template..." rows={4} columns={1} />;
  if (isError || !template) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const ownerClinic = clinicsData?.items.find((c) => c.id === template.ownerClinicId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{template.entityType}</h1>
          <p className="text-sm text-muted">
            Version {template.version} · Owner: {ownerClinic?.clinicName ?? template.ownerClinicId}
          </p>
        </div>
        <PermissionGuard permission="masterdata.template.manage">
          <Button variant="secondary" onClick={() => setShowPush(true)}>
            Push to Branches
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Template Payload</span>
          <PermissionGuard permission="masterdata.template.manage">
            {!isEditing && (
              <Button variant="tertiary" onClick={startEdit}>
                Edit
              </Button>
            )}
          </PermissionGuard>
        </div>
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={10}
              error={payloadError ?? undefined}
            />
            {updateTemplate.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(updateTemplate.error)}
              </p>
            )}
            <div className="flex gap-2">
              <Button isLoading={updateTemplate.isPending} onClick={submitEdit}>
                Save
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <pre className="overflow-x-auto rounded-md bg-surface p-3 text-xs font-tabular text-foreground">
            {JSON.stringify(template.templatePayload, null, 2)}
          </pre>
        )}
      </div>

      {pushTemplate.data && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <span className="text-sm font-medium text-foreground">Last Push Result</span>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Branch</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pushTemplate.data.map((result) => (
                <TableRow key={result.branchId}>
                  <TableCell>{branchesData?.items.find((b) => b.id === result.branchId)?.branchName ?? result.branchId}</TableCell>
                  <TableCell>
                    <Badge tone={PUSH_STATUS_TONE[result.status]}>{result.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <span className="text-sm font-medium text-foreground">Drift Report</span>
        {driftLoading && <LoadingState label="Loading drift report..." rows={3} columns={1} />}
        {driftIsError && <ErrorState message={getApiErrorMessage(driftError)} />}
        {!driftLoading && !driftIsError && (!driftEntries || driftEntries.length === 0) && (
          <p className="text-sm text-muted">This template has not been pushed to any branch yet.</p>
        )}
        {!driftLoading && !driftIsError && driftEntries && driftEntries.length > 0 && (
          <div className="flex flex-col gap-4">
            {driftEntries.map((entry) => (
              <div key={entry.branchId} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {branchesData?.items.find((b) => b.id === entry.branchId)?.branchName ?? entry.branchId}
                  </span>
                  <span className="text-xs text-muted">Pushed v{entry.pushedVersion}</span>
                  <Badge tone={entry.isStale ? "warning" : "success"}>{entry.isStale ? "Stale" : "Up to date"}</Badge>
                </div>
                {entry.fieldDrifts.length > 0 && (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Field</TableHeaderCell>
                        <TableHeaderCell>Pushed Value</TableHeaderCell>
                        <TableHeaderCell>Current Value</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entry.fieldDrifts.map((drift) => (
                        <TableRow key={drift.field}>
                          <TableCell>{drift.field}</TableCell>
                          <TableCell className="font-tabular">{JSON.stringify(drift.pushedValue)}</TableCell>
                          <TableCell className="font-tabular">{JSON.stringify(drift.currentValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPush && (
        <Modal title="Push to Branches" onClose={() => setShowPush(false)}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {branchesData?.items.map((branch) => (
                <label key={branch.id} className="flex items-center gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedBranchIds.includes(branch.id)}
                    onChange={() => toggleBranch(branch.id)}
                  />
                  {branch.branchName}
                </label>
              ))}
            </div>
            {pushTemplate.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(pushTemplate.error)}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="secondary" onClick={() => setShowPush(false)}>
                Cancel
              </Button>
              <Button
                isLoading={pushTemplate.isPending}
                disabled={selectedBranchIds.length === 0}
                onClick={() =>
                  pushTemplate.mutate(selectedBranchIds, {
                    onSuccess: () => setShowPush(false),
                  })
                }
              >
                Push
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
