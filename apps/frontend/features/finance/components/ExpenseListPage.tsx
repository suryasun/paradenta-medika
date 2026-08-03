"use client";

import Link from "next/link";
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
import { Textarea } from "@/components/ui/Textarea";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { branchService } from "@/features/master-data/services/branch.service";
import { accountService } from "../services/finance.service";
import { useCreateExpense, useExpenses } from "../hooks/useExpense";
import { FinanceExpenseStatus } from "../types/finance.types";

export const EXPENSE_STATUS_TONE: Record<FinanceExpenseStatus, "neutral" | "warning" | "info" | "error" | "success"> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED: "info",
  REJECTED: "error",
  PAID: "success",
  CANCELLED: "error",
};

export function ExpenseListPage() {
  const { data, isLoading, isError, error, refetch } = useExpenses();
  const [showCreate, setShowCreate] = useState(false);

  const createAction = (
    <PermissionGuard permission="finance.expense.create">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Expense
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading expenses..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const expenses = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Expenses</h1>
        {createAction}
      </div>

      {expenses.length === 0 ? (
        <EmptyState title="No expenses yet" description="Record the first operating expense." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Expense No.</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.expenseNo}</TableCell>
                <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell className="font-tabular">{formatCurrency(expense.amount)}</TableCell>
                <TableCell>
                  <Badge tone={EXPENSE_STATUS_TONE[expense.status]}>{expense.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/finance/expenses/${expense.id}`} className="text-sm font-medium text-primary hover:underline">
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateExpenseModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateExpenseModal({ onClose }: { onClose: () => void }) {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: accountsData } = useQuery({ queryKey: ["finance", "accounts", "options"], queryFn: () => accountService.list() });
  const [branchId, setBranchId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [description, setDescription] = useState("");
  const createExpense = useCreateExpense();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || !category.trim() || !expenseAccountId || !amount) return;
    createExpense.mutate(
      { branchId, expenseDate, category, expenseAccountId, amount: Number(amount), payeeName: payeeName || undefined, description: description || undefined },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="New Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="expenseBranch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
          <option value="">Select a branch</option>
          {branchesData?.items.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName}
            </option>
          ))}
        </Select>
        <Input id="expenseDate" label="Expense Date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
        <Input id="expenseCategory" label="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
        <Select id="expenseAccount" label="Expense Account" value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} required>
          <option value="">Select an account</option>
          {accountsData?.items
            .filter((a) => a.accountType === "expense" && a.isPostable)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
        </Select>
        <Input id="expenseAmount" label="Amount" type="number" min={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input id="expensePayee" label="Payee Name (optional)" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} />
        <Textarea id="expenseDescription" label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

        {createExpense.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createExpense.error)}
          </p>
        )}
        <Button type="submit" isLoading={createExpense.isPending} disabled={!branchId || !category.trim() || !expenseAccountId || !amount}>
          Create Expense
        </Button>
      </form>
    </Modal>
  );
}
