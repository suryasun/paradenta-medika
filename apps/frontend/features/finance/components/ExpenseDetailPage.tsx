"use client";

import { FormEvent, useState } from "react";
import { Banknote, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useAuthStore } from "@/stores/auth.store";
import { useCashAccounts } from "../hooks/useAccounts";
import { useApproveExpense, useExpense, usePayExpense, useRejectExpense, useSubmitExpense } from "../hooks/useExpense";
import { EXPENSE_STATUS_TONE } from "./ExpenseListPage";

export function ExpenseDetailPage({ expenseId }: { expenseId: string }) {
  const { data: expense, isLoading, isError, error, refetch } = useExpense(expenseId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const submitExpense = useSubmitExpense(expenseId);
  const approveExpense = useApproveExpense(expenseId);
  const rejectExpense = useRejectExpense(expenseId);
  const payExpense = usePayExpense(expenseId);
  const [showReject, setShowReject] = useState(false);
  const [showPay, setShowPay] = useState(false);

  if (isLoading) return <LoadingState label="Loading expense..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!expense) return null;

  const isOwnDraft = expense.createdBy === currentUserId;
  const mutationError = submitExpense.error ?? approveExpense.error ?? rejectExpense.error ?? payExpense.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{expense.expenseNo}</h1>
          <Badge tone={EXPENSE_STATUS_TONE[expense.status]}>{expense.status}</Badge>
        </div>
        <div className="flex gap-2">
          {expense.status === "DRAFT" && (
            <PermissionGuard permission="finance.expense.create">
              <Button isLoading={submitExpense.isPending} onClick={() => submitExpense.mutate()}>
                <Send size={14} strokeWidth={1.75} aria-hidden="true" />
                Submit
              </Button>
            </PermissionGuard>
          )}
          {expense.status === "SUBMITTED" && (
            <PermissionGuard permission="finance.expense.approve">
              <Button
                isLoading={approveExpense.isPending}
                onClick={() => approveExpense.mutate()}
                disabled={isOwnDraft}
                title={isOwnDraft ? "You created this expense — a different approver must approve it" : undefined}
              >
                <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowReject(true)}
                disabled={isOwnDraft}
                title={isOwnDraft ? "You created this expense — a different approver must reject it" : undefined}
              >
                <ThumbsDown size={14} strokeWidth={1.75} aria-hidden="true" />
                Reject
              </Button>
            </PermissionGuard>
          )}
          {expense.status === "APPROVED" && (
            <PermissionGuard permission="finance.expense.pay">
              <Button onClick={() => setShowPay(true)}>
                <Banknote size={14} strokeWidth={1.75} aria-hidden="true" />
                Pay
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {mutationError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(mutationError)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Category</span>
          <p className="text-sm text-foreground">{expense.category}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Amount</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(expense.amount)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Payee</span>
          <p className="text-sm text-foreground">{expense.payeeName ?? "-"}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Paid Amount</span>
          <p className="font-tabular text-sm text-foreground">{expense.paidAmount != null ? formatCurrency(expense.paidAmount) : "-"}</p>
        </div>
      </div>

      {expense.description && <p className="text-sm text-foreground">{expense.description}</p>}
      {expense.rejectionReason && <p className="text-sm text-error">Rejected: {expense.rejectionReason}</p>}

      {showReject && (
        <RejectExpenseModal isLoading={rejectExpense.isPending} onSubmit={(reason) => rejectExpense.mutate(reason, { onSuccess: () => setShowReject(false) })} onClose={() => setShowReject(false)} />
      )}
      {showPay && (
        <PayExpenseModal expenseAmount={expense.amount} isLoading={payExpense.isPending} onSubmit={(payload) => payExpense.mutate(payload, { onSuccess: () => setShowPay(false) })} onClose={() => setShowPay(false)} />
      )}
    </div>
  );
}

function RejectExpenseModal({ isLoading, onSubmit, onClose }: { isLoading: boolean; onSubmit: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  }

  return (
    <Modal title="Reject Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="expenseRejectReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        <Button type="submit" variant="danger" isLoading={isLoading} disabled={!reason.trim()}>
          Confirm Reject
        </Button>
      </form>
    </Modal>
  );
}

function PayExpenseModal({
  expenseAmount,
  isLoading,
  onSubmit,
  onClose,
}: {
  expenseAmount: number;
  isLoading: boolean;
  onSubmit: (payload: { cashAccountId: string; paymentDate: string; amount: number; referenceNo?: string; note?: string }) => void;
  onClose: () => void;
}) {
  const { data: cashAccountsData } = useCashAccounts();
  const [cashAccountId, setCashAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(String(expenseAmount));
  const [referenceNo, setReferenceNo] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cashAccountId || !amount) return;
    onSubmit({ cashAccountId, paymentDate, amount: Number(amount), referenceNo: referenceNo || undefined });
  }

  return (
    <Modal title="Pay Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="payExpenseCashAccount" label="Cash Account" value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} required>
          <option value="">Select a cash account</option>
          {cashAccountsData?.items.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Input id="payExpenseDate" label="Payment Date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        <Input id="payExpenseAmount" label="Amount" type="number" min={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input id="payExpenseReference" label="Reference No. (optional)" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
        <Button type="submit" isLoading={isLoading} disabled={!cashAccountId || !amount}>
          Confirm Payment
        </Button>
      </form>
    </Modal>
  );
}
