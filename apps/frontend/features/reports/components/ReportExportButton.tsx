"use client";

import { Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCreateReportJob } from "../hooks/useReportJob";
import { useDownloadExport } from "../hooks/useDownloadExport";
import { ReportJobFilters } from "../types/reports.types";

/**
 * Phase 4 hardening (reporting depth gap): branch.dashboard/comparison/
 * performance were the only implemented reports with zero export
 * capability that wasn't a documented, deliberate limitation (see
 * ReportCatalog.ts's Phase 4 extension comment). This is the same
 * "Generate & Export" -> job -> "Download CSV" flow ReportCatalogPage.tsx
 * already has for the 10 literal-catalog reports, extracted into a small
 * reusable component so BranchComparisonPage/BranchPerformancePage don't
 * duplicate that orchestration.
 */
export function ReportExportButton({
  reportCode,
  permission,
  filters,
  disabled,
}: {
  reportCode: string;
  permission: string;
  filters: ReportJobFilters;
  disabled?: boolean;
}) {
  const createJob = useCreateReportJob();
  const downloadExport = useDownloadExport();

  function handleExport() {
    createJob.mutate({ reportCode, payload: { filters, format: "csv" } });
  }

  const result = createJob.data;
  const canDownload = result?.job.status === "COMPLETED" && !!result.artifactId;

  return (
    <PermissionGuard permission={permission}>
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" isLoading={createJob.isPending} onClick={handleExport} disabled={disabled}>
          <Download size={14} strokeWidth={1.75} aria-hidden="true" />
          Generate & Export
        </Button>

        {createJob.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createJob.error)}
          </p>
        )}

        {result && (
          <div className="flex items-center gap-2">
            <Badge tone={result.job.status === "COMPLETED" ? "success" : result.job.status === "FAILED" ? "error" : "warning"}>
              {result.job.status}
            </Badge>
            {result.job.errorMessage && <span className="text-sm text-error">{result.job.errorMessage}</span>}
            {canDownload && (
              <Button isLoading={downloadExport.isPending} onClick={() => downloadExport.mutate(result.artifactId!)}>
                <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                Download CSV
              </Button>
            )}
            {downloadExport.isError && (
              <span role="alert" className="text-sm text-error">
                {getApiErrorMessage(downloadExport.error)}
              </span>
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
