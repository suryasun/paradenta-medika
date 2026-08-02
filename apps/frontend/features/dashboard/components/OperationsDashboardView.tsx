"use client";

import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useOperationsDashboard } from "../hooks/useOperationsDashboard";
import { MetricCard } from "./MetricCard";

const QUEUE_STATUS_LABELS: Record<string, string> = {
  WAITING: "Waiting",
  CALLED: "Called",
  IN_SERVICE: "In Service",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
  SKIPPED: "Skipped",
};

export function OperationsDashboardView() {
  const { data, isLoading, isError, error, refetch } = useOperationsDashboard();

  if (isLoading) return <LoadingState label="Loading dashboard..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!data) return null;

  const metricValue = (code: string) => data.metrics.find((m) => m.code === code)?.value ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Operations Dashboard</h1>
        <p className="text-sm text-muted">
          As of {new Date(data.dataAsOf).toLocaleString()} · {data.scope.timezone}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Reservations Today" value={String(metricValue("reservation.today.count"))} />
        <MetricCard label="Collected Today" value={formatCurrency(metricValue("billing.collection.today"))} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Queue Today</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(QUEUE_STATUS_LABELS).map(([status, label]) => (
            <MetricCard key={status} label={label} value={String(metricValue(`queue.count.${status}`))} />
          ))}
        </div>
      </div>
    </div>
  );
}
