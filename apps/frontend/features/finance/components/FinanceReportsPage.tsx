"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { branchService } from "@/features/master-data/services/branch.service";
import {
  useCashFlowReport,
  useDailyClosingReport,
  useExpensesReport,
  useGeneralLedgerReport,
  useIncomeStatementReport,
  useTrialBalanceReport,
} from "../hooks/useFinanceReports";
import { EXPENSE_STATUS_TONE } from "./ExpenseListPage";

// finance.md §10/§14: table-only this pass (Recharts upgrade deferred,
// flagged in the approved plan). Reports only ever include posted
// journals server-side; this page just renders what the API returns.
export function FinanceReportsPage() {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const [branchId, setBranchId] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Financial Reports</h1>
      <Select id="reportsBranch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="max-w-xs">
        <option value="">Select a branch</option>
        {branchesData?.items.map((b) => (
          <option key={b.id} value={b.id}>
            {b.branchName}
          </option>
        ))}
      </Select>

      {!branchId ? (
        <EmptyState title="Select a branch" description="Every financial report is scoped to a branch." />
      ) : (
        <Tabs
          items={[
            { key: "trial-balance", label: "Trial Balance", content: <TrialBalanceReport branchId={branchId} /> },
            { key: "general-ledger", label: "General Ledger", content: <GeneralLedgerReport branchId={branchId} /> },
            { key: "income-statement", label: "Income Statement", content: <IncomeStatementReport branchId={branchId} /> },
            { key: "cash-flow", label: "Cash Flow", content: <CashFlowReport branchId={branchId} /> },
            { key: "expenses", label: "Expenses", content: <ExpensesReport /> },
            { key: "daily-closing", label: "Daily Closing", content: <DailyClosingReport /> },
          ]}
        />
      )}
    </div>
  );
}

function ReportMeta({ generatedAt }: { generatedAt: Date }) {
  return <p className="text-xs text-muted">Data as of {generatedAt.toLocaleString()} — posted journals only</p>;
}

function TrialBalanceReport({ branchId }: { branchId: string }) {
  const { data, isLoading, isError, error } = useTrialBalanceReport({ branchId });

  if (isLoading) return <LoadingState label="Loading trial balance..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.length === 0) return <EmptyState title="No posted journals in range" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Account</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Debit</TableHeaderCell>
            <TableHeaderCell>Credit</TableHeaderCell>
            <TableHeaderCell>Balance</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.accountId}>
              <TableCell>
                {row.accountCode} — {row.accountName}
              </TableCell>
              <TableCell>{row.accountType}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.debit)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.credit)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GeneralLedgerReport({ branchId }: { branchId: string }) {
  const { data, isLoading, isError, error } = useGeneralLedgerReport({ branchId });

  if (isLoading) return <LoadingState label="Loading general ledger..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No posted journals in range" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Journal No.</TableHeaderCell>
            <TableHeaderCell>Account</TableHeaderCell>
            <TableHeaderCell>Debit</TableHeaderCell>
            <TableHeaderCell>Credit</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((row, index) => (
            <TableRow key={`${row.journalId}-${index}`}>
              <TableCell>{new Date(row.journalDate).toLocaleDateString()}</TableCell>
              <TableCell>{row.journalNo ?? "—"}</TableCell>
              <TableCell>
                {row.accountCode} — {row.accountName}
              </TableCell>
              <TableCell className="font-tabular">{row.debit > 0 ? formatCurrency(row.debit) : "-"}</TableCell>
              <TableCell className="font-tabular">{row.credit > 0 ? formatCurrency(row.credit) : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function IncomeStatementReport({ branchId }: { branchId: string }) {
  const { data, isLoading, isError, error } = useIncomeStatementReport({ branchId });

  if (isLoading) return <LoadingState label="Loading income statement..." rows={5} columns={2} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <ReportMeta generatedAt={new Date()} />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Revenue</h3>
        <Table>
          <TableBody>
            {data.revenue.map((line) => (
              <TableRow key={line.accountId}>
                <TableCell>
                  {line.accountCode} — {line.accountName}
                </TableCell>
                <TableCell className="font-tabular">{formatCurrency(line.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Expense</h3>
        <Table>
          <TableBody>
            {data.expense.map((line) => (
              <TableRow key={line.accountId}>
                <TableCell>
                  {line.accountCode} — {line.accountName}
                </TableCell>
                <TableCell className="font-tabular">{formatCurrency(line.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid grid-cols-3 gap-4 rounded-lg border border-border bg-surface p-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Total Revenue</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(data.totalRevenue)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Total Expense</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(data.totalExpense)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Net Result</span>
          <p className="font-tabular text-sm font-semibold text-foreground">{formatCurrency(data.netResult)}</p>
        </div>
      </div>
    </div>
  );
}

function CashFlowReport({ branchId }: { branchId: string }) {
  const { data, isLoading, isError, error } = useCashFlowReport({ branchId });

  if (isLoading) return <LoadingState label="Loading cash flow..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.length === 0) return <EmptyState title="No cash movements in range" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Cash Account</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Inflow</TableHeaderCell>
            <TableHeaderCell>Outflow</TableHeaderCell>
            <TableHeaderCell>Net</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={`${row.cashAccountId}-${index}`}>
              <TableCell>
                {row.cashAccountCode} — {row.cashAccountName}
              </TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.inflow)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.outflow)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.net)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpensesReport() {
  const { data, isLoading, isError, error } = useExpensesReport();

  if (isLoading) return <LoadingState label="Loading expenses report..." rows={5} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No expenses in range" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Expense No.</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{expense.expenseNo}</TableCell>
              <TableCell>{expense.category}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(expense.amount)}</TableCell>
              <TableCell>
                <Badge tone={EXPENSE_STATUS_TONE[expense.status]}>{expense.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DailyClosingReport() {
  const { data, isLoading, isError, error } = useDailyClosingReport();

  if (isLoading) return <LoadingState label="Loading daily closing report..." rows={5} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No daily closings in range" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Expected</TableHeaderCell>
            <TableHeaderCell>Counted</TableHeaderCell>
            <TableHeaderCell>Variance</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((closing) => (
            <TableRow key={closing.id}>
              <TableCell>{new Date(closing.closingDate).toLocaleDateString()}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(closing.expectedBalance)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(closing.countedBalance)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(closing.variance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
