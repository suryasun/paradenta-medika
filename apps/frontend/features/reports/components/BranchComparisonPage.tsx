"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendChart } from "@/components/ui/TrendChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { branchService } from "@/features/master-data/services/branch.service";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useBranchComparison } from "../hooks/useBranchComparison";
import { metricLabel } from "../lib/metricLabels";
import { ReportExportButton } from "./ReportExportButton";

interface MetricChartPoint {
  branchName: string;
  value: number;
}

// Phase 4, task-219 (docs/02-design/pages/reporting.md §8.2). First
// multi-branch, side-by-side dashboard in this module -- a
// RPT_SCOPE_FORBIDDEN 403 (any requested branch outside the requester's
// scope) surfaces via the standard inline getApiErrorMessage pattern.
export function BranchComparisonPage() {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const { data, isLoading, isError, error, refetch } = useBranchComparison(selectedBranchIds);

  function toggleBranch(branchId: string) {
    setSelectedBranchIds((prev) => (prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]));
  }

  const metricCodes = data ? Array.from(new Set(data.flatMap((entry) => entry.metrics.map((m) => m.code)))) : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Branch Comparison</h1>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <span className="text-sm font-medium text-foreground">Branches</span>
        <div className="flex flex-wrap gap-3">
          {branchesData?.items.map((branch) => (
            <label key={branch.id} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={selectedBranchIds.includes(branch.id)} onChange={() => toggleBranch(branch.id)} />
              {branch.branchName}
            </label>
          ))}
        </div>
      </div>

      <ReportExportButton
        reportCode="branch.comparison"
        permission="report.job.create"
        filters={{ branchIds: selectedBranchIds }}
        disabled={selectedBranchIds.length === 0}
      />

      {selectedBranchIds.length === 0 && <p className="text-sm text-muted">Select two or more branches to compare.</p>}
      {selectedBranchIds.length > 0 && isLoading && <LoadingState label="Loading comparison..." rows={4} columns={selectedBranchIds.length + 1} />}
      {selectedBranchIds.length > 0 && isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {selectedBranchIds.length > 0 && !isLoading && !isError && data && data.length > 0 && (
        <div className="flex flex-col gap-6">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Metric</TableHeaderCell>
                {data.map((entry) => (
                  <TableHeaderCell key={entry.branchId}>{entry.branchName}</TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {metricCodes.map((code) => (
                <TableRow key={code}>
                  <TableCell className="font-medium">{metricLabel(code)}</TableCell>
                  {data.map((entry) => {
                    const metric = entry.metrics.find((m) => m.code === code);
                    return (
                      <TableCell key={entry.branchId} className="font-tabular">
                        {metric ? (metric.currency ? formatCurrency(metric.value, metric.currency) : metric.value.toLocaleString()) : "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-6">
            {metricCodes.map((code) => {
              const chartData: MetricChartPoint[] = data.map((entry) => ({
                branchName: entry.branchName,
                value: entry.metrics.find((m) => m.code === code)?.value ?? 0,
              }));
              return (
                <div key={code}>
                  <h3 className="mb-2 text-sm font-medium text-foreground">{metricLabel(code)}</h3>
                  <TrendChart data={chartData} xKey="branchName" yKey="value" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedBranchIds.length > 0 && !isLoading && !isError && data && data.length === 0 && (
        <EmptyState title="No comparison data" description="No metrics were returned for the selected branches." />
      )}
    </div>
  );
}
