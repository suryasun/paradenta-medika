"use client";

import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useOperationsHealth } from "../hooks/useAuditLog";

export function OperationsHealthPage() {
  const { data, isLoading, isError, error, refetch } = useOperationsHealth();

  if (isLoading) return <LoadingState label="Loading operations health..." cards={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!data) return null;

  const statusEntries = Object.entries(data.byStatus);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-foreground">Operations Health</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Queue Depth</span>
          <p className="font-tabular text-2xl font-semibold text-foreground">{data.queueDepth}</p>
        </div>
        {statusEntries.map(([status, count]) => (
          <div key={status} className="rounded-lg border border-border bg-surface p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">{status}</span>
            <p className="font-tabular text-2xl font-semibold text-foreground">{count}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Recent Failures</h2>
        {data.recentFailures.length === 0 ? (
          <EmptyState title="No recent failures" />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Job Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Attempts</TableHeaderCell>
                <TableHeaderCell>Last Error</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentFailures.map((failure) => (
                <TableRow key={failure.id}>
                  <TableCell>{failure.jobType}</TableCell>
                  <TableCell>
                    <Badge tone="error">{failure.status}</Badge>
                  </TableCell>
                  <TableCell className="font-tabular">{failure.attempts}</TableCell>
                  <TableCell className="max-w-md truncate" title={failure.lastError ?? undefined}>
                    {failure.lastError ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
