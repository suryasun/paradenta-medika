"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { branchService } from "@/features/master-data/services/branch.service";
import { useCashAccounts } from "../hooks/useAccounts";
import { useApproveDailyClosing, useCreateDailyClosing, useDailyClosings } from "../hooks/useDailyClosing";
import { DailyClosingStatus } from "../types/finance.types";

const STATUS_TONE: Record<DailyClosingStatus, "warning" | "success"> = {
  SUBMITTED: "warning",
  APPROVED: "success",
};

export function DailyClosingListPage() {
  const { data, isLoading, isError, error, refetch } = useDailyClosings();
  const { data: cashAccountsData } = useCashAccounts();
  const [showCreate, setShowCreate] = useState(false);
  const approveClosing = useApproveDailyClosing();

  const cashAccountName = (id: string) => cashAccountsData?.items.find((c) => c.id === id)?.name ?? id;

  const createAction = (
    <PermissionGuard permission="finance.cash.close">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Daily Closing
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading daily closings..." rows={4} columns={6} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const closings = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Daily Cash Closing</h1>
        {createAction}
      </div>

      {closings.length === 0 ? (
        <EmptyState title="No daily closings yet" description="Record the first cash closing for a shift." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Cash Account</TableHeaderCell>
              <TableHeaderCell>Expected</TableHeaderCell>
              <TableHeaderCell>Counted</TableHeaderCell>
              <TableHeaderCell>Variance</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {closings.map((closing) => (
              <TableRow key={closing.id}>
                <TableCell>{new Date(closing.closingDate).toLocaleDateString()}</TableCell>
                <TableCell>{cashAccountName(closing.cashAccountId)}</TableCell>
                <TableCell className="font-tabular">{formatCurrency(closing.expectedBalance)}</TableCell>
                <TableCell className="font-tabular">{formatCurrency(closing.countedBalance)}</TableCell>
                <TableCell className={`font-tabular ${closing.variance !== 0 ? "text-error" : ""}`}>{formatCurrency(closing.variance)}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[closing.status]}>{closing.status}</Badge>
                </TableCell>
                <TableCell>
                  {closing.status === "SUBMITTED" && (
                    <PermissionGuard permission="finance.cash.approve_close">
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => approveClosing.mutate(closing.id)}
                      >
                        Approve
                      </button>
                    </PermissionGuard>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {approveClosing.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(approveClosing.error)}
        </p>
      )}

      {showCreate && <CreateDailyClosingModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateDailyClosingModal({ onClose }: { onClose: () => void }) {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: cashAccountsData } = useCashAccounts();
  const [branchId, setBranchId] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [countedBalance, setCountedBalance] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const createClosing = useCreateDailyClosing();

  const cashAccount = cashAccountsData?.items.find((c) => c.id === cashAccountId);
  const expectedBalance = cashAccount?.currentBalance ?? 0;
  const variance = countedBalance !== "" ? Number(countedBalance) - expectedBalance : 0;
  const needsReason = countedBalance !== "" && variance !== 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || !cashAccountId || !cashierId.trim() || countedBalance === "" || (needsReason && !varianceReason.trim())) return;
    createClosing.mutate(
      { branchId, cashAccountId, cashierId, closingDate, countedBalance: Number(countedBalance), varianceReason: needsReason ? varianceReason : undefined },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="New Daily Closing" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="closingBranch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
          <option value="">Select a branch</option>
          {branchesData?.items.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName}
            </option>
          ))}
        </Select>
        <Select id="closingCashAccount" label="Cash Account" value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} required>
          <option value="">Select a cash account</option>
          {cashAccountsData?.items.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Input id="closingCashierId" label="Cashier User Id" value={cashierId} onChange={(e) => setCashierId(e.target.value)} required />
        <Input id="closingDate" label="Closing Date" type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} required />

        {cashAccountId && <p className="text-sm text-muted">Expected balance: {formatCurrency(expectedBalance)}</p>}
        <Input id="closingCountedBalance" label="Counted Cash" type="number" min={0} value={countedBalance} onChange={(e) => setCountedBalance(e.target.value)} required />
        {countedBalance !== "" && (
          <p className={`text-sm font-medium ${variance !== 0 ? "text-error" : "text-success"}`}>Variance: {formatCurrency(variance)}</p>
        )}
        {needsReason && (
          <Input id="closingVarianceReason" label="Variance Reason (required)" value={varianceReason} onChange={(e) => setVarianceReason(e.target.value)} required />
        )}

        {createClosing.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createClosing.error)}
          </p>
        )}
        <Button
          type="submit"
          isLoading={createClosing.isPending}
          disabled={!branchId || !cashAccountId || !cashierId.trim() || countedBalance === "" || (needsReason && !varianceReason.trim())}
        >
          Submit Closing
        </Button>
      </form>
    </Modal>
  );
}
