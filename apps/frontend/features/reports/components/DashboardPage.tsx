"use client";

import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useDashboard } from "../hooks/useDashboard";
import { metricLabel } from "../lib/metricLabels";
import { DashboardKey } from "../types/reports.types";

const DASHBOARD_TITLES: Record<DashboardKey, string> = {
  executive: "Executive Dashboard",
  operations: "Operations Dashboard",
  clinical: "Clinical Dashboard",
  finance: "Finance Dashboard",
  warehouse: "Warehouse Dashboard",
};

// Every metric here is a single current value, not a time series (the
// backend's dashboard_summaries table has no history the API exposes) --
// KPI cards, not fabricated trend charts. See the approved plan for this
// pass: design-system.md's "every dashboard gets a chart" aspiration
// doesn't match what this endpoint actually returns.
export function DashboardPage({ dashboardKey }: { dashboardKey: DashboardKey }) {
  const { data, isLoading, isError, error, refetch } = useDashboard(dashboardKey);

  if (isLoading) return <LoadingState label={`Loading ${DASHBOARD_TITLES[dashboardKey]}...`} cards={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">{DASHBOARD_TITLES[dashboardKey]}</h1>
        <div className="flex items-center gap-2">
          <Badge tone={data.freshness === "fresh" ? "success" : "warning"}>{data.freshness === "fresh" ? "Fresh" : "Partial"}</Badge>
          <span className="text-xs text-muted">as of {new Date(data.dataAsOf).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {data.metrics.map((metric) => (
          <div key={metric.code} className="rounded-lg border border-border bg-surface p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">{metricLabel(metric.code)}</span>
            <p className="font-tabular text-2xl font-semibold text-foreground">
              {metric.currency ? formatCurrency(metric.value, metric.currency) : metric.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">Definition version {data.definitionVersion}</p>
    </div>
  );
}
