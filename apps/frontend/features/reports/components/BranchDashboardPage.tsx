"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { branchService } from "@/features/master-data/services/branch.service";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useBranchDashboard } from "../hooks/useBranchDashboard";
import { metricLabel } from "../lib/metricLabels";
import { ReportExportButton } from "./ReportExportButton";

// Phase 4, task-218 (docs/02-design/pages/reporting.md §8.1). Unlike the 5
// fixed dashboards, this endpoint requires an explicit branchId -- the page
// needs its own branch selector rather than inferring scope from the user.
export function BranchDashboardPage() {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const [branchId, setBranchId] = useState("");
  const { data, isLoading, isError, error, refetch } = useBranchDashboard(branchId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Branch Dashboard</h1>
        {data && (
          <div className="flex items-center gap-2">
            <Badge tone={data.freshness === "fresh" ? "success" : "warning"}>{data.freshness === "fresh" ? "Fresh" : "Partial"}</Badge>
            <span className="text-xs text-muted">as of {new Date(data.dataAsOf).toLocaleString()}</span>
          </div>
        )}
      </div>

      <Select id="branch-dashboard-branch" label="Branch" aria-label="Select branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
        <option value="">Select a branch...</option>
        {branchesData?.items.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.branchName}
          </option>
        ))}
      </Select>

      <ReportExportButton reportCode="branch.dashboard" permission="report.job.create" filters={{ branchIds: branchId ? [branchId] : undefined }} disabled={!branchId} />

      {!branchId && <p className="text-sm text-muted">Select a branch to view its dashboard.</p>}
      {branchId && isLoading && <LoadingState label="Loading branch dashboard..." cards={4} />}
      {branchId && isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {branchId && !isLoading && !isError && data && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 text-sm font-medium text-foreground">Queue</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-surface p-4">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Total Patients Today</span>
                <p className="font-tabular text-2xl font-semibold text-foreground">{data.queue.branchSummary.totalPatientToday}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Avg Waiting Time (min)</span>
                <p className="font-tabular text-2xl font-semibold text-foreground">
                  {data.queue.branchSummary.averageWaitingTimeMinutes ?? "-"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Avg Service Time (min)</span>
                <p className="font-tabular text-2xl font-semibold text-foreground">
                  {data.queue.branchSummary.averageServiceTimeMinutes ?? "-"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Completion Rate</span>
                <p className="font-tabular text-2xl font-semibold text-foreground">{data.queue.branchSummary.completionRate}%</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-foreground">Billing</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {data.billing.map((metric) => (
                <div key={metric.code} className="rounded-lg border border-border bg-surface p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">{metricLabel(metric.code)}</span>
                  <p className="font-tabular text-2xl font-semibold text-foreground">
                    {metric.currency ? formatCurrency(metric.value, metric.currency) : metric.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted">Definition version {data.definitionVersion}</p>
        </div>
      )}
    </div>
  );
}
