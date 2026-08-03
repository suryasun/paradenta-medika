"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, Plus, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Stepper } from "@/components/ui/Stepper";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { branchService } from "@/features/master-data/services/branch.service";
import {
  useCloseFinancialPeriod,
  useCreateFinancialPeriod,
  useFinancialPeriods,
  useLockFinancialPeriod,
  useReopenFinancialPeriod,
} from "../hooks/useFinancialPeriod";
import { FinancialPeriod, FinancialPeriodStatus } from "../types/finance.types";

const STATUS_TONE: Record<FinancialPeriodStatus, "success" | "warning" | "neutral"> = {
  OPEN: "success",
  LOCKED: "warning",
  CLOSED: "neutral",
};

const CLOSE_STEPS = [
  { key: "confirm-closings", label: "Daily closings approved" },
  { key: "resolve-events", label: "Pending source events resolved" },
  { key: "reconcile-cash", label: "Cash reconciled" },
  { key: "review-trial-balance", label: "Trial balance reviewed" },
  { key: "review-exceptions", label: "Expense/settlement exceptions reviewed" },
  { key: "close", label: "Close period" },
];

export function FinancialPeriodListPage() {
  const { data, isLoading, isError, error, refetch } = useFinancialPeriods();
  const [showCreate, setShowCreate] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState<FinancialPeriod | null>(null);
  const [reopeningPeriod, setReopeningPeriod] = useState<FinancialPeriod | null>(null);
  const lockPeriod = useLockFinancialPeriod();

  const createAction = (
    <PermissionGuard permission="finance.period.manage">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Period
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading financial periods..." rows={4} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const periods = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Financial Periods</h1>
        {createAction}
      </div>

      {periods.length === 0 ? (
        <EmptyState title="No financial periods yet" description="Create the first accounting period." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Period</TableHeaderCell>
              <TableHeaderCell>Start</TableHeaderCell>
              <TableHeaderCell>End</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.map((period) => (
              <TableRow key={period.id}>
                <TableCell>{period.periodName}</TableCell>
                <TableCell>{new Date(period.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(period.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[period.status]}>{period.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    {period.status === "OPEN" && (
                      <PermissionGuard permission="finance.period.lock">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          onClick={() => lockPeriod.mutate(period.id)}
                        >
                          <Lock size={13} strokeWidth={1.75} aria-hidden="true" />
                          Lock
                        </button>
                      </PermissionGuard>
                    )}
                    {period.status === "LOCKED" && (
                      <PermissionGuard permission="finance.period.close">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          onClick={() => setClosingPeriod(period)}
                        >
                          Close
                        </button>
                      </PermissionGuard>
                    )}
                    {period.status === "CLOSED" && (
                      <PermissionGuard permission="finance.period.reopen">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm font-medium text-error hover:underline"
                          onClick={() => setReopeningPeriod(period)}
                        >
                          <Unlock size={13} strokeWidth={1.75} aria-hidden="true" />
                          Reopen
                        </button>
                      </PermissionGuard>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {lockPeriod.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(lockPeriod.error)}
        </p>
      )}

      {showCreate && <CreatePeriodModal onClose={() => setShowCreate(false)} />}
      {closingPeriod && <ClosePeriodStepperModal period={closingPeriod} onClose={() => setClosingPeriod(null)} />}
      {reopeningPeriod && <ReopenPeriodModal period={reopeningPeriod} onClose={() => setReopeningPeriod(null)} />}
    </div>
  );
}

function CreatePeriodModal({ onClose }: { onClose: () => void }) {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const [branchId, setBranchId] = useState("");
  const [periodName, setPeriodName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const createPeriod = useCreateFinancialPeriod();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || !periodName.trim() || !startDate || !endDate) return;
    createPeriod.mutate({ branchId, periodName, startDate, endDate }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title="New Financial Period" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="periodBranch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
          <option value="">Select a branch</option>
          {branchesData?.items.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName}
            </option>
          ))}
        </Select>
        <Input id="periodName" label="Period Name" placeholder="e.g. August 2026" value={periodName} onChange={(e) => setPeriodName(e.target.value)} required />
        <Input id="periodStart" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <Input id="periodEnd" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        {createPeriod.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createPeriod.error)}
          </p>
        )}
        <Button type="submit" isLoading={createPeriod.isPending} disabled={!branchId || !periodName.trim() || !startDate || !endDate}>
          Create Period
        </Button>
      </form>
    </Modal>
  );
}

function ClosePeriodStepperModal({ period, onClose }: { period: FinancialPeriod; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const closePeriod = useCloseFinancialPeriod();
  const isLastStep = stepIndex === CLOSE_STEPS.length - 1;

  function handleNext() {
    if (isLastStep) {
      closePeriod.mutate(period.id, { onSuccess: () => onClose() });
      return;
    }
    setStepIndex((i) => i + 1);
  }

  return (
    <Modal title={`Close ${period.periodName}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Stepper steps={CLOSE_STEPS} currentKey={CLOSE_STEPS[stepIndex].key} />
        <p className="text-sm text-foreground">Confirm: {CLOSE_STEPS[stepIndex].label}</p>
        {closePeriod.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(closePeriod.error)}
          </p>
        )}
        <Button onClick={handleNext} isLoading={closePeriod.isPending}>
          {isLastStep ? "Close Period" : "Confirm & Continue"}
        </Button>
      </div>
    </Modal>
  );
}

function ReopenPeriodModal({ period, onClose }: { period: FinancialPeriod; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const reopenPeriod = useReopenFinancialPeriod();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) return;
    reopenPeriod.mutate({ id: period.id, reason: reason.trim() }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title={`Reopen ${period.periodName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-xs text-muted">Reopening a closed period is Owner/delegated-Administrator only.</p>
        <Input id="reopenReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        {reopenPeriod.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(reopenPeriod.error)}
          </p>
        )}
        <Button type="submit" variant="danger" isLoading={reopenPeriod.isPending} disabled={!reason.trim()}>
          Confirm Reopen
        </Button>
      </form>
    </Modal>
  );
}
