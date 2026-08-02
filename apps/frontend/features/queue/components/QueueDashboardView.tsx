"use client";

import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { getApiErrorMessage } from "@/lib/api-client";
import { useQueueDashboard } from "../hooks/useQueueDashboard";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
    </Card>
  );
}

// docs/06-tasks/task-047.md. "Doctor Active/Idle" and "Queue Capacity" from
// docs/03-sad/14-module-queue.md Section 27 are intentionally not rendered:
// apps/backend's QueueDashboardResponseDto omits them (no real-time
// doctor-presence tracking or branch max-queue config in Phase 1 schema).
export function QueueDashboardView() {
  const { data, isLoading, isError, error, refetch } = useQueueDashboard({});

  if (isLoading) return <LoadingState label="Loading queue dashboard..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-foreground">Queue Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Waiting" value={data.queueSummary.waiting} />
        <StatCard label="Called" value={data.queueSummary.called} />
        <StatCard label="In Service" value={data.queueSummary.inService} />
        <StatCard label="Completed" value={data.queueSummary.completed} />
        <StatCard label="Cancelled" value={data.queueSummary.cancelled} />
        <StatCard label="No Show" value={data.queueSummary.noShow} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients Today" value={data.branchSummary.totalPatientToday} />
        <StatCard label="Avg. Waiting (min)" value={data.branchSummary.averageWaitingTimeMinutes ?? "-"} />
        <StatCard label="Avg. Service (min)" value={data.branchSummary.averageServiceTimeMinutes ?? "-"} />
        <StatCard label="Completion Rate" value={`${Math.round(data.branchSummary.completionRate * 100)}%`} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Queue by Doctor</h2>
        {data.doctorSummary.length === 0 ? (
          <EmptyState title="No doctor activity yet today" />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Doctor ID</TableHeaderCell>
                <TableHeaderCell>Queue Count</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.doctorSummary.map((row) => (
                <TableRow key={row.doctorId}>
                  <TableCell>{row.doctorId}</TableCell>
                  <TableCell>{row.queueCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
