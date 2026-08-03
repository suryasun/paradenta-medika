"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCreateFeatureFlag, useFeatureFlags, useUpdateFeatureFlag } from "../hooks/useFeatureFlag";
import { FeatureFlag, FeatureFlagRiskClass } from "../types/system.types";

// Not built on AdminEntityListPage: FeatureFlag's active/inactive concept
// is `enabled` (a toggle with policy rules -- critical risk needs a review
// date), not the generic `isActive` shape that component assumes.
export function FeatureFlagsPage() {
  const { data, isLoading, isError, error, refetch } = useFeatureFlags();
  const [showCreate, setShowCreate] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const updateFlag = useUpdateFeatureFlag();

  const createAction = (
    <PermissionGuard permission="system.feature-flag.manage">
      <Button onClick={() => setShowCreate(true)}>New Feature Flag</Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading feature flags..." rows={4} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const flags = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Feature Flags</h1>
        {createAction}
      </div>

      {flags.length === 0 ? (
        <EmptyState title="No feature flags yet" description="Create the first flag." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Key</TableHeaderCell>
              <TableHeaderCell>Owner Module</TableHeaderCell>
              <TableHeaderCell>Risk</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.map((flag) => (
              <TableRow key={flag.id}>
                <TableCell>{flag.flagKey}</TableCell>
                <TableCell>{flag.ownerModule}</TableCell>
                <TableCell>
                  <Badge tone={flag.riskClass === "critical" ? "error" : "neutral"}>{flag.riskClass}</Badge>
                </TableCell>
                <TableCell>
                  <Badge tone={flag.enabled ? "success" : "neutral"}>{flag.enabled ? "Enabled" : "Disabled"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    <PermissionGuard permission="system.feature-flag.manage">
                      <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setEditingFlag(flag)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-muted hover:underline"
                        onClick={() => updateFlag.mutate({ flagKey: flag.flagKey, payload: { enabled: !flag.enabled } })}
                      >
                        {flag.enabled ? "Disable" : "Enable"}
                      </button>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {updateFlag.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(updateFlag.error)}
        </p>
      )}

      {showCreate && <CreateFeatureFlagModal onClose={() => setShowCreate(false)} />}
      {editingFlag && <EditFeatureFlagModal flag={editingFlag} onClose={() => setEditingFlag(null)} />}
    </div>
  );
}

function CreateFeatureFlagModal({ onClose }: { onClose: () => void }) {
  const [flagKey, setFlagKey] = useState("");
  const [ownerModule, setOwnerModule] = useState("");
  const [targetScope, setTargetScope] = useState("");
  const [riskClass, setRiskClass] = useState<FeatureFlagRiskClass>("standard");
  const [reviewDate, setReviewDate] = useState("");
  const [description, setDescription] = useState("");
  const createFlag = useCreateFeatureFlag();

  const needsReviewDate = riskClass === "critical";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!flagKey.trim() || !ownerModule.trim() || (needsReviewDate && !reviewDate)) return;
    createFlag.mutate(
      { flagKey, ownerModule, targetScope: targetScope || undefined, riskClass, reviewDate: reviewDate || undefined, description: description || undefined },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="New Feature Flag" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="flagKey" label="Flag Key" value={flagKey} onChange={(e) => setFlagKey(e.target.value)} required />
        <Input id="flagOwnerModule" label="Owner Module" value={ownerModule} onChange={(e) => setOwnerModule(e.target.value)} required />
        <Input id="flagTargetScope" label="Target Scope (optional)" value={targetScope} onChange={(e) => setTargetScope(e.target.value)} />
        <Select id="flagRiskClass" label="Risk Class" value={riskClass} onChange={(e) => setRiskClass(e.target.value as FeatureFlagRiskClass)}>
          <option value="standard">standard</option>
          <option value="critical">critical</option>
        </Select>
        {needsReviewDate && (
          <Input id="flagReviewDate" label="Review Date (required for critical risk)" type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} required />
        )}
        <Input id="flagDescription" label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

        {createFlag.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createFlag.error)}
          </p>
        )}
        <Button type="submit" isLoading={createFlag.isPending} disabled={!flagKey.trim() || !ownerModule.trim() || (needsReviewDate && !reviewDate)}>
          Create Flag
        </Button>
      </form>
    </Modal>
  );
}

function EditFeatureFlagModal({ flag, onClose }: { flag: FeatureFlag; onClose: () => void }) {
  const [targetScope, setTargetScope] = useState(flag.targetScope ?? "");
  const [reviewDate, setReviewDate] = useState(flag.reviewDate?.slice(0, 10) ?? "");
  const [description, setDescription] = useState(flag.description ?? "");
  const updateFlag = useUpdateFeatureFlag();

  const needsReviewDate = flag.riskClass === "critical";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsReviewDate && !reviewDate) return;
    updateFlag.mutate(
      { flagKey: flag.flagKey, payload: { targetScope: targetScope || undefined, reviewDate: reviewDate || undefined, description: description || undefined } },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title={`Edit — ${flag.flagKey}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-xs text-muted">Key, owner module, and risk class cannot be changed after creation.</p>
        <Input id="editFlagTargetScope" label="Target Scope" value={targetScope} onChange={(e) => setTargetScope(e.target.value)} />
        {needsReviewDate && (
          <Input id="editFlagReviewDate" label="Review Date (required for critical risk)" type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} required />
        )}
        <Input id="editFlagDescription" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        {updateFlag.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(updateFlag.error)}
          </p>
        )}
        <Button type="submit" isLoading={updateFlag.isPending} disabled={needsReviewDate && !reviewDate}>
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}
