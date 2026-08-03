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
import { useAuthStore } from "@/stores/auth.store";
import {
  useApproveChangeRequest,
  useCreateChangeRequest,
  useCreateSystemParameter,
  useParameterVersions,
  useRollbackParameter,
  useSystemParameters,
} from "../hooks/useSystemParameter";
import { ConfigurationChangeRequest, SystemParameter, SystemParameterValueType } from "../types/system.types";

const VALUE_TYPES: SystemParameterValueType[] = ["STRING", "INTEGER", "DECIMAL", "BOOLEAN", "ENUM", "DATE", "DURATION", "JSON", "SECRET_REF"];

// system.routes.ts has no GET /system/configuration-change-requests list
// route (confirmed) -- change requests are only reachable via the object
// returned from create/rollback. This page holds every change request
// created this session in local state so its Approve action stays
// reachable, same fallback pattern as Warehouse's Stock Transfer.
export function SystemParametersPage() {
  const { data, isLoading, isError, error, refetch } = useSystemParameters();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [proposingParameter, setProposingParameter] = useState<SystemParameter | null>(null);
  const [rollingBackParameter, setRollingBackParameter] = useState<SystemParameter | null>(null);
  const [viewingVersionsOf, setViewingVersionsOf] = useState<string | null>(null);
  const [changeRequests, setChangeRequests] = useState<ConfigurationChangeRequest[]>([]);
  const approveChangeRequest = useApproveChangeRequest();

  function handleCreated(request: ConfigurationChangeRequest) {
    setChangeRequests((prev) => [request, ...prev]);
  }

  function handleApprove(request: ConfigurationChangeRequest) {
    approveChangeRequest.mutate(request.id, {
      onSuccess: (updated) => setChangeRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r))),
    });
  }

  const createAction = (
    <PermissionGuard permission="system.parameter.manage">
      <Button onClick={() => setShowCreate(true)}>New Parameter</Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading system parameters..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const parameters = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">System Parameters</h1>
        {createAction}
      </div>

      {parameters.length === 0 ? (
        <EmptyState title="No system parameters yet" description="Create the first configuration parameter." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Key</TableHeaderCell>
              <TableHeaderCell>Scope</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>High Risk</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parameters.map((parameter) => (
              <TableRow key={parameter.id}>
                <TableCell>{parameter.key}</TableCell>
                <TableCell>{parameter.scopeType}</TableCell>
                <TableCell className="font-tabular">{parameter.value}</TableCell>
                <TableCell className="font-tabular">v{parameter.version}</TableCell>
                <TableCell>{parameter.isHighRisk && <Badge tone="warning">High Risk</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setViewingVersionsOf(parameter.key)}>
                      Versions
                    </button>
                    <PermissionGuard permission="system.config-request.create">
                      <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setProposingParameter(parameter)}>
                        Propose Change
                      </button>
                      <button type="button" className="text-sm font-medium text-muted hover:underline" onClick={() => setRollingBackParameter(parameter)}>
                        Rollback
                      </button>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {changeRequests.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted">Change Requests (this session)</h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Parameter</TableHeaderCell>
                <TableHeaderCell>Proposed Value</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changeRequests.map((request) => {
                const isOwnRequest = request.requestedBy === currentUserId;
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.parameterKey} {request.isRollback && <Badge tone="warning">Rollback to v{request.rollbackFromVersion}</Badge>}
                    </TableCell>
                    <TableCell className="font-tabular">{request.proposedValue}</TableCell>
                    <TableCell>
                      <Badge tone={request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "error" : "warning"}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "PENDING" && (
                        <PermissionGuard permission="system.config-request.approve">
                          <Button
                            isLoading={approveChangeRequest.isPending}
                            onClick={() => handleApprove(request)}
                            disabled={isOwnRequest}
                            title={isOwnRequest ? "You requested this change — a different approver must approve it" : undefined}
                          >
                            Approve
                          </Button>
                        </PermissionGuard>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {approveChangeRequest.isError && (
            <p role="alert" className="mt-2 text-sm text-error">
              {getApiErrorMessage(approveChangeRequest.error)}
            </p>
          )}
        </div>
      )}

      {showCreate && <CreateParameterModal onClose={() => setShowCreate(false)} />}
      {proposingParameter && (
        <ProposeChangeModal parameter={proposingParameter} onClose={() => setProposingParameter(null)} onCreated={handleCreated} />
      )}
      {rollingBackParameter && (
        <RollbackModal parameter={rollingBackParameter} onClose={() => setRollingBackParameter(null)} onCreated={handleCreated} />
      )}
      {viewingVersionsOf && <VersionsModal parameterKey={viewingVersionsOf} onClose={() => setViewingVersionsOf(null)} />}
    </div>
  );
}

function CreateParameterModal({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState("");
  const [valueType, setValueType] = useState<SystemParameterValueType>("STRING");
  const [value, setValue] = useState("");
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [reason, setReason] = useState("");
  const createParameter = useCreateSystemParameter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!key.trim() || !value.trim()) return;
    createParameter.mutate({ key, valueType, value, isHighRisk, reason: reason || undefined }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title="New System Parameter" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="parameterKey" label="Key" value={key} onChange={(e) => setKey(e.target.value)} required />
        <Select id="parameterValueType" label="Value Type" value={valueType} onChange={(e) => setValueType(e.target.value as SystemParameterValueType)}>
          {VALUE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Input id="parameterValue" label="Value" value={value} onChange={(e) => setValue(e.target.value)} required />
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" checked={isHighRisk} onChange={(e) => setIsHighRisk(e.target.checked)} />
          High Risk (requires independent approval for any future change)
        </label>
        <Input id="parameterReason" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />

        {createParameter.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createParameter.error)}
          </p>
        )}
        <Button type="submit" isLoading={createParameter.isPending} disabled={!key.trim() || !value.trim()}>
          Create Parameter
        </Button>
      </form>
    </Modal>
  );
}

function ProposeChangeModal({
  parameter,
  onClose,
  onCreated,
}: {
  parameter: SystemParameter;
  onClose: () => void;
  onCreated: (request: ConfigurationChangeRequest) => void;
}) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const createChangeRequest = useCreateChangeRequest();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    createChangeRequest.mutate(
      { parameterKey: parameter.key, payload: { valueType: parameter.valueType, value, reason: reason || undefined } },
      { onSuccess: (request) => { onCreated(request); onClose(); } },
    );
  }

  return (
    <Modal title={`Propose Change — ${parameter.key}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-xs text-muted">Current value: {parameter.value}</p>
        <Input id="proposedValue" label="New Value" value={value} onChange={(e) => setValue(e.target.value)} required />
        <Input id="proposeReason" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        {createChangeRequest.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createChangeRequest.error)}
          </p>
        )}
        <Button type="submit" isLoading={createChangeRequest.isPending} disabled={!value.trim()}>
          Submit for Approval
        </Button>
      </form>
    </Modal>
  );
}

function RollbackModal({
  parameter,
  onClose,
  onCreated,
}: {
  parameter: SystemParameter;
  onClose: () => void;
  onCreated: (request: ConfigurationChangeRequest) => void;
}) {
  const [version, setVersion] = useState("");
  const [reason, setReason] = useState("");
  const rollbackParameter = useRollbackParameter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!version || !reason.trim()) return;
    rollbackParameter.mutate(
      { parameterKey: parameter.key, payload: { version: Number(version), reason: reason.trim() } },
      { onSuccess: (request) => { onCreated(request); onClose(); } },
    );
  }

  return (
    <Modal title={`Rollback — ${parameter.key}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-xs text-muted">Current version: v{parameter.version}. This proposes a new change request restoring an earlier version — it still needs approval.</p>
        <Input id="rollbackVersion" label="Target Version" type="number" min={1} value={version} onChange={(e) => setVersion(e.target.value)} required />
        <Input id="rollbackReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {rollbackParameter.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(rollbackParameter.error)}
          </p>
        )}
        <Button type="submit" isLoading={rollbackParameter.isPending} disabled={!version || !reason.trim()}>
          Propose Rollback
        </Button>
      </form>
    </Modal>
  );
}

function VersionsModal({ parameterKey, onClose }: { parameterKey: string; onClose: () => void }) {
  const { data, isLoading, isError, error } = useParameterVersions(parameterKey);

  return (
    <Modal title={`Version History — ${parameterKey}`} onClose={onClose}>
      {isLoading && <LoadingState label="Loading versions..." rows={3} columns={3} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} />}
      {data && data.items.length === 0 && <EmptyState title="No version history" />}
      {data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>Effective From</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-tabular">v{version.version}</TableCell>
                <TableCell className="font-tabular">{version.value}</TableCell>
                <TableCell>{new Date(version.effectiveFrom).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Modal>
  );
}
