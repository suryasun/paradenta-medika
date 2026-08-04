"use client";

import { useState } from "react";
import { Download, Play, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TrendChart } from "@/components/ui/TrendChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useCancelReportJob, useCreateReportJob } from "../hooks/useReportJob";
import { useDownloadExport } from "../hooks/useDownloadExport";
import { useOnDemandReport } from "../hooks/useOnDemandReport";
import { useReportCatalog } from "../hooks/useReportCatalog";
import { metricLabel } from "../lib/metricLabels";
import { CreateReportJobResult, DashboardResponse, QueuePerformanceReport, ReportCatalogEntry, ReportJobFilters } from "../types/reports.types";
import { IncomeStatementResult, TrialBalanceRow } from "@/features/finance/types/finance.types";
import { Batch, StockLedgerEntry } from "@/features/warehouse/types/warehouse.types";

// finance.trial-balance/income-statement require branchId; inventory.stock-card
// requires warehouseId+itemId (else RPT_FILTER_INVALID, confirmed server-side) --
// this map drives which filter inputs render per code, not a generic form.
const CODES_REQUIRING_BRANCH = new Set(["finance.trial-balance", "finance.income-statement"]);
const CODES_REQUIRING_WAREHOUSE_ITEM = new Set(["inventory.stock-card"]);
const CODES_WITH_OPTIONAL_BRANCH = new Set(["operations.queue-performance", "clinical.visit-summary", "billing.daily-summary"]);
const CODES_WITH_OPTIONAL_WAREHOUSE = new Set(["inventory.expiry"]);

export function ReportCatalogPage() {
  const { data, isLoading, isError, error, refetch } = useReportCatalog();
  const [runningReport, setRunningReport] = useState<ReportCatalogEntry | null>(null);

  if (isLoading) return <LoadingState label="Loading report catalog..." rows={6} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const reports = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Reports</h1>
      {reports.length === 0 ? (
        <EmptyState title="No reports available to your role" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Report</TableHeaderCell>
              <TableHeaderCell>Module</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.code}>
                <TableCell>{report.name}</TableCell>
                <TableCell>{report.ownerModule}</TableCell>
                <TableCell>
                  <Badge tone={report.implemented ? "success" : "neutral"}>{report.implemented ? "Available" : "Not yet available"}</Badge>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                    disabled={!report.implemented}
                    title={!report.implemented ? "Cataloged but not built yet on the backend" : undefined}
                    onClick={() => setRunningReport(report)}
                  >
                    Run Report
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {runningReport && <RunReportModal report={runningReport} onClose={() => setRunningReport(null)} />}
    </div>
  );
}

function RunReportModal({ report, onClose }: { report: ReportCatalogEntry; onClose: () => void }) {
  const [branchId, setBranchId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const onDemand = useOnDemandReport<unknown>();
  const createJob = useCreateReportJob();
  const cancelJob = useCancelReportJob();
  const downloadExport = useDownloadExport();

  const needsBranch = CODES_REQUIRING_BRANCH.has(report.code);
  const needsWarehouseItem = CODES_REQUIRING_WAREHOUSE_ITEM.has(report.code);
  const showOptionalBranch = CODES_WITH_OPTIONAL_BRANCH.has(report.code);
  const showOptionalWarehouse = CODES_WITH_OPTIONAL_WAREHOUSE.has(report.code);

  const filtersValid = (!needsBranch || !!branchId) && (!needsWarehouseItem || (!!warehouseId && !!itemId));

  function buildParams(): Record<string, unknown> {
    return {
      branchId: branchId || undefined,
      warehouseId: warehouseId || undefined,
      itemId: itemId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
  }

  function handleViewNow() {
    if (!filtersValid) return;
    onDemand.mutate({ reportCode: report.code, params: buildParams() });
  }

  function handleGenerateJob() {
    if (!filtersValid) return;
    const filters: ReportJobFilters = {
      branchIds: branchId ? [branchId] : undefined,
      warehouseId: warehouseId || undefined,
      itemId: itemId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
    createJob.mutate({ reportCode: report.code, payload: { filters, format: "csv" } });
  }

  return (
    <Modal title={report.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          {(needsBranch || showOptionalBranch) && (
            <Input
              id="reportBranchId"
              label={needsBranch ? "Branch Id (required)" : "Branch Id (optional)"}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            />
          )}
          {(needsWarehouseItem || showOptionalWarehouse) && (
            <Input
              id="reportWarehouseId"
              label={needsWarehouseItem ? "Warehouse Id (required)" : "Warehouse Id (optional)"}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            />
          )}
          {needsWarehouseItem && <Input id="reportItemId" label="Item Id (required)" value={itemId} onChange={(e) => setItemId(e.target.value)} />}
          <Input id="reportDateFrom" label="Date From (optional)" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input id="reportDateTo" label="Date To (optional)" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <PermissionGuard permission="report.catalog.read">
            <Button variant="secondary" isLoading={onDemand.isPending} onClick={handleViewNow} disabled={!filtersValid}>
              <Play size={14} strokeWidth={1.75} aria-hidden="true" />
              View Now
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="report.job.create">
            <Button isLoading={createJob.isPending} onClick={handleGenerateJob} disabled={!filtersValid}>
              Generate & Export
            </Button>
          </PermissionGuard>
        </div>

        {onDemand.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(onDemand.error)}
          </p>
        )}
        {onDemand.data !== undefined && <OnDemandResult reportCode={report.code} data={onDemand.data} />}

        {createJob.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createJob.error)}
          </p>
        )}
        {createJob.data && (
          <JobResultPanel
            result={createJob.data}
            onCancel={(jobId) => cancelJob.mutate(jobId)}
            cancelPending={cancelJob.isPending}
            cancelError={cancelJob.error}
            onDownload={(artifactId) => downloadExport.mutate(artifactId)}
            downloadPending={downloadExport.isPending}
            downloadError={downloadExport.error}
          />
        )}
      </div>
    </Modal>
  );
}

function OnDemandResult({ reportCode, data }: { reportCode: string; data: unknown }) {
  if (reportCode === "operations.queue-performance") {
    const report = data as QueuePerformanceReport;
    return (
      <div className="flex flex-col gap-3">
        <MetricGrid metrics={report.metrics} />
        <div className="grid grid-cols-3 gap-3 text-sm">
          <p>Waiting: {report.queue.queueSummary.waiting}</p>
          <p>Called: {report.queue.queueSummary.called}</p>
          <p>In Service: {report.queue.queueSummary.inService}</p>
          <p>Completed: {report.queue.queueSummary.completed}</p>
          <p>Cancelled: {report.queue.queueSummary.cancelled}</p>
          <p>No Show: {report.queue.queueSummary.noShow}</p>
        </div>
        <p className="text-sm text-muted">
          Avg wait {report.queue.branchSummary.averageWaitingTimeMinutes.toFixed(1)}min · Avg service{" "}
          {report.queue.branchSummary.averageServiceTimeMinutes.toFixed(1)}min · Completion rate{" "}
          {(report.queue.branchSummary.completionRate * 100).toFixed(0)}%
        </p>
        {report.queue.doctorSummary.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted">Queue Count by Doctor</p>
            <TrendChart data={report.queue.doctorSummary} xKey="doctorId" yKey="queueCount" xLabel={(d) => d.doctorId.slice(0, 8)} />
          </div>
        )}
      </div>
    );
  }

  if (reportCode === "clinical.visit-summary" || reportCode === "billing.daily-summary") {
    return <MetricGrid metrics={(data as DashboardResponse).metrics} />;
  }

  if (reportCode === "finance.trial-balance") {
    const rows = data as TrialBalanceRow[];
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Account</TableHeaderCell>
            <TableHeaderCell>Debit</TableHeaderCell>
            <TableHeaderCell>Credit</TableHeaderCell>
            <TableHeaderCell>Balance</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.accountId}>
              <TableCell>
                {row.accountCode} — {row.accountName}
              </TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.debit)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.credit)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (reportCode === "finance.income-statement") {
    const result = data as IncomeStatementResult;
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p>Total Revenue: {formatCurrency(result.totalRevenue)}</p>
        <p>Total Expense: {formatCurrency(result.totalExpense)}</p>
        <p className="font-semibold">Net Result: {formatCurrency(result.netResult)}</p>
      </div>
    );
  }

  if (reportCode === "inventory.stock-card") {
    const rows = data as StockLedgerEntry[];
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Qty In</TableHeaderCell>
            <TableHeaderCell>Qty Out</TableHeaderCell>
            <TableHeaderCell>Balance</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{new Date(entry.transactionDate).toLocaleDateString()}</TableCell>
              <TableCell className="font-tabular">{entry.qtyIn > 0 ? entry.qtyIn : "-"}</TableCell>
              <TableCell className="font-tabular">{entry.qtyOut > 0 ? entry.qtyOut : "-"}</TableCell>
              <TableCell className="font-tabular">{entry.balance}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (reportCode === "inventory.expiry") {
    const rows = data as Batch[];
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Batch No.</TableHeaderCell>
            <TableHeaderCell>Expiry Date</TableHeaderCell>
            <TableHeaderCell>Remaining Qty</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell>{batch.batchNumber}</TableCell>
              <TableCell>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "-"}</TableCell>
              <TableCell className="font-tabular">{batch.remainingQuantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return <pre className="max-h-64 overflow-auto rounded-md bg-slate-50 p-2 text-xs">{JSON.stringify(data, null, 2)}</pre>;
}

function MetricGrid({ metrics }: { metrics: { code: string; value: number; currency?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.code} className="rounded-md border border-border p-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">{metricLabel(metric.code)}</span>
          <p className="font-tabular text-lg font-semibold text-foreground">
            {metric.currency ? formatCurrency(metric.value, metric.currency) : metric.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function JobResultPanel({
  result,
  onCancel,
  cancelPending,
  cancelError,
  onDownload,
  downloadPending,
  downloadError,
}: {
  result: CreateReportJobResult;
  onCancel: (jobId: string) => void;
  cancelPending: boolean;
  cancelError: unknown;
  onDownload: (artifactId: string) => void;
  downloadPending: boolean;
  downloadError: unknown;
}) {
  const { job, artifactId } = result;
  const canCancel = job.status === "QUEUED" || job.status === "RUNNING";

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Job {job.id.slice(0, 8)}</p>
        <Badge tone={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "error" : "warning"}>{job.status}</Badge>
      </div>
      {job.errorMessage && <p className="mt-1 text-sm text-error">{job.errorMessage}</p>}
      {cancelError !== undefined && cancelError !== null && (
        <p role="alert" className="mt-1 text-sm text-error">
          {getApiErrorMessage(cancelError)}
        </p>
      )}
      {downloadError !== undefined && downloadError !== null && (
        <p role="alert" className="mt-1 text-sm text-error">
          {getApiErrorMessage(downloadError)}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        {job.status === "COMPLETED" && artifactId && (
          <Button isLoading={downloadPending} onClick={() => onDownload(artifactId)}>
            <Download size={14} strokeWidth={1.75} aria-hidden="true" />
            Download CSV
          </Button>
        )}
        {canCancel && (
          <Button variant="danger" isLoading={cancelPending} onClick={() => onCancel(job.id)}>
            <XCircle size={14} strokeWidth={1.75} aria-hidden="true" />
            Cancel
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Export is logged.</p>
    </div>
  );
}
