"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuditLogs } from "../hooks/useAuditLog";
import { AuditLog } from "../types/system.types";

// Audit Log is immutable/read-only by design (no create/update/delete route
// exists) -- this page is filter + table + a value-diff viewer, nothing else.
export function AuditLogPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null);
  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    entity: entity || undefined,
    action: action || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Audit Log</h1>
      <div className="flex flex-wrap gap-3">
        <Input id="auditDateFrom" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input id="auditDateTo" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Input id="auditEntity" label="Entity" placeholder="e.g. Journal" value={entity} onChange={(e) => setEntity(e.target.value)} />
        <Input id="auditAction" label="Action" placeholder="e.g. POST" value={action} onChange={(e) => setAction(e.target.value)} />
      </div>

      {isLoading && <LoadingState label="Loading audit log..." rows={6} columns={5} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {data && data.items.length === 0 && <EmptyState title="No audit entries match these filters" />}
      {data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Entity</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>IP</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {log.entity} <span className="text-xs text-muted">#{log.entityId.slice(0, 8)}</span>
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.userId ? log.userId.slice(0, 8) : "-"}</TableCell>
                <TableCell>{log.ipAddress ?? "-"}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    onClick={() => setViewingLog(log)}
                  >
                    <Eye size={13} strokeWidth={1.75} aria-hidden="true" />
                    View Changes
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {viewingLog && <AuditLogDiffModal log={viewingLog} onClose={() => setViewingLog(null)} />}
    </div>
  );
}

function AuditLogDiffModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <Modal title={`${log.action} — ${log.entity}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Old Value</p>
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
            {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : "—"}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">New Value</p>
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
            {log.newValue ? JSON.stringify(log.newValue, null, 2) : "—"}
          </pre>
        </div>
      </div>
      {log.correlationId && <p className="mt-3 text-xs text-muted">Correlation Id: {log.correlationId}</p>}
    </Modal>
  );
}
