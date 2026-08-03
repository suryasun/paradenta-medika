"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useActivityLogs } from "../hooks/useAuditLog";

// No module currently writes to activity_logs (confirmed: read-endpoint
// only, no producer wired anywhere in this codebase yet) -- this list will
// render empty until a future pass adds a writer. That's a documented
// backend gap, not a bug in this page.
export function ActivityLogPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const { data, isLoading, isError, error, refetch } = useActivityLogs({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    module: moduleFilter || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Activity Log</h1>
      <div className="flex flex-wrap gap-3">
        <Input id="activityDateFrom" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input id="activityDateTo" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Input id="activityModule" label="Module" placeholder="e.g. warehouse" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} />
      </div>

      {isLoading && <LoadingState label="Loading activity log..." rows={6} columns={4} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No activity recorded yet" description="No module writes to the activity log yet — this is a known backend gap, not an error." />
      )}
      {data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Module</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Message</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
