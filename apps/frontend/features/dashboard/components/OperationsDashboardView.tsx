"use client";

import { CalendarCheck, CheckCircle2, Clock, Megaphone, SkipForward, Stethoscope, UserX, Wallet, XCircle } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useOperationsDashboard } from "../hooks/useOperationsDashboard";
import { MetricCard } from "./MetricCard";

const QUEUE_STATUS_META: Record<string, { label: string; icon: typeof Clock }> = {
  WAITING: { label: "Waiting", icon: Clock },
  CALLED: { label: "Called", icon: Megaphone },
  IN_SERVICE: { label: "In Service", icon: Stethoscope },
  COMPLETED: { label: "Completed", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", icon: XCircle },
  NO_SHOW: { label: "No Show", icon: UserX },
  SKIPPED: { label: "Skipped", icon: SkipForward },
};

export function OperationsDashboardView() {
  const { data, isLoading, isError, error, refetch } = useOperationsDashboard();

  if (isLoading) return <LoadingState label="Loading dashboard..." cards={6} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!data) return null;

  const metricValue = (code: string) => data.metrics.find((m) => m.code === code)?.value ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-foreground">Operations Dashboard</h1>
        <p className="text-sm text-muted">
          As of {new Date(data.dataAsOf).toLocaleString()} · {data.scope.timezone}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Reservations Today" value={metricValue("reservation.today.count")} icon={CalendarCheck} />
        <MetricCard label="Collected Today" value={metricValue("billing.collection.today")} format={formatCurrency} icon={Wallet} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Queue Today</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(QUEUE_STATUS_META).map(([status, meta]) => (
            <MetricCard key={status} label={meta.label} value={metricValue(`queue.count.${status}`)} icon={meta.icon} />
          ))}
        </div>
      </div>
    </div>
  );
}
