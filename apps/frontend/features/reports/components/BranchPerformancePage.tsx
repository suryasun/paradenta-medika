"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendChart } from "@/components/ui/TrendChart";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { branchService } from "@/features/master-data/services/branch.service";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useBranchPerformance } from "../hooks/useBranchPerformance";
import { ReportExportButton } from "./ReportExportButton";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const today = new Date();
const defaultFrom = new Date(today);
defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 6);

// Phase 4, task-220 (docs/02-design/pages/reporting.md §8.3). The one
// Phase 4 report whose data is genuinely trended (day-by-day fan-out) --
// date sits on TrendChart's x-axis, unlike Comparison's branch-on-x-axis.
export function BranchPerformancePage() {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const [branchId, setBranchId] = useState("");
  const [dateFrom, setDateFrom] = useState(toDateOnly(defaultFrom));
  const [dateTo, setDateTo] = useState(toDateOnly(today));

  const { data, isLoading, isError, error, refetch } = useBranchPerformance(branchId, dateFrom, dateTo);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Branch Performance</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <Select id="branch-performance-branch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">Select a branch...</option>
          {branchesData?.items.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.branchName}
            </option>
          ))}
        </Select>
        <Input id="branch-performance-from" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input id="branch-performance-to" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <ReportExportButton
        reportCode="branch.performance"
        permission="report.job.create"
        filters={{ branchIds: branchId ? [branchId] : undefined, dateFrom, dateTo }}
        disabled={!branchId}
      />

      {!branchId && <p className="text-sm text-muted">Select a branch and date range to view its performance trend.</p>}
      {branchId && isLoading && <LoadingState label="Loading branch performance..." rows={5} columns={5} />}
      {branchId && isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {branchId && !isLoading && !isError && data && (
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Total Patients per Day</h3>
            <TrendChart data={data} xKey="date" yKey="totalPatients" />
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Total Patients</TableHeaderCell>
                <TableHeaderCell>Avg Waiting (min)</TableHeaderCell>
                <TableHeaderCell>Completion Rate</TableHeaderCell>
                <TableHeaderCell>Billing Collected</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((period) => (
                <TableRow key={period.date}>
                  <TableCell className="font-tabular">{period.date}</TableCell>
                  <TableCell className="font-tabular">{period.totalPatients}</TableCell>
                  <TableCell className="font-tabular">{period.averageWaitingTimeMinutes ?? "-"}</TableCell>
                  <TableCell className="font-tabular">{period.completionRate}%</TableCell>
                  <TableCell className="font-tabular">{formatCurrency(period.billingCollected, "IDR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
