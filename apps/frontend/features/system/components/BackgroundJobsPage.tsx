"use client";

import { useState } from "react";
import { RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useBackgroundJobs, useCancelBackgroundJob, useRetryBackgroundJob } from "../hooks/useBackgroundJob";
import { BackgroundJob, BackgroundJobStatus } from "../types/system.types";

const STATUS_OPTIONS: BackgroundJobStatus[] = ["QUEUED", "RUNNING", "SUCCEEDED", "RETRYING", "FAILED", "CANCELLED", "DEAD_LETTER"];

const STATUS_TONE: Record<BackgroundJobStatus, "neutral" | "info" | "success" | "warning" | "error"> = {
  QUEUED: "neutral",
  RUNNING: "info",
  SUCCEEDED: "success",
  RETRYING: "warning",
  FAILED: "error",
  CANCELLED: "neutral",
  DEAD_LETTER: "error",
};

// system_background_jobs is currently self-contained -- no other module
// writes rows into it yet (confirmed via schema comment), so this list
// renders empty in a fresh environment. That's a backend-side gap in the
// other epics, not a bug in this page; the endpoints themselves are real.
export function BackgroundJobsPage() {
  const [status, setStatus] = useState<BackgroundJobStatus | "">("");
  const { data, isLoading, isError, error, refetch } = useBackgroundJobs({ status: status || undefined });
  const [viewingJob, setViewingJob] = useState<BackgroundJob | null>(null);

  if (isLoading) return <LoadingState label="Loading background jobs..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const jobs = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Background Jobs</h1>
      <Select id="jobStatusFilter" label="Status" value={status} onChange={(e) => setStatus(e.target.value as BackgroundJobStatus | "")} className="max-w-xs">
        <option value="">All Statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      {jobs.length === 0 ? (
        <EmptyState
          title="No background jobs"
          description="No module currently writes into the job registry yet — this list stays empty until a producer is wired, not an error."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Job Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Attempts</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.jobType}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[job.status]}>{job.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="font-tabular">
                  {job.attempts} / {job.maxAttempts}
                </TableCell>
                <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setViewingJob(job)}>
                    View Detail
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {viewingJob && <JobDetailModal job={viewingJob} onClose={() => setViewingJob(null)} />}
    </div>
  );
}

function JobDetailModal({ job, onClose }: { job: BackgroundJob; onClose: () => void }) {
  const retryJob = useRetryBackgroundJob(job.id);
  const cancelJob = useCancelBackgroundJob(job.id);
  const canRetry = job.isRetryable && (job.status === "FAILED" || job.status === "DEAD_LETTER") && job.attempts < job.maxAttempts;
  const canCancel = job.status === "QUEUED" || job.status === "RUNNING" || job.status === "RETRYING";
  const mutationError = retryJob.error ?? cancelJob.error;

  return (
    <Modal title={job.jobType} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Status</span>
            <p>
              <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
            </p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Attempts</span>
            <p className="font-tabular">
              {job.attempts} / {job.maxAttempts}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Priority</span>
            <p className="font-tabular">{job.priority}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Locked By</span>
            <p>{job.lockedBy ?? "-"}</p>
          </div>
        </div>
        {job.lastError && (
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Last Error</span>
            <p className="text-sm text-error">{job.lastError}</p>
          </div>
        )}

        {mutationError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(mutationError)}
          </p>
        )}

        <div className="flex gap-2">
          {canRetry && (
            <PermissionGuard permission="system.job.manage">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                onClick={() => retryJob.mutate()}
              >
                <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
                Retry
              </button>
            </PermissionGuard>
          )}
          {canCancel && (
            <PermissionGuard permission="system.job.manage">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-error hover:underline"
                onClick={() => cancelJob.mutate()}
              >
                <XCircle size={13} strokeWidth={1.75} aria-hidden="true" />
                Cancel
              </button>
            </PermissionGuard>
          )}
        </div>
      </div>
    </Modal>
  );
}
