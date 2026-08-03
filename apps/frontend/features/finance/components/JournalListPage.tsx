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
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { branchService } from "@/features/master-data/services/branch.service";
import { accountService } from "../services/finance.service";
import { useCreateJournal, useJournals } from "../hooks/useJournal";
import { FinanceJournalStatus, JournalLineEntry } from "../types/finance.types";

export const JOURNAL_STATUS_TONE: Record<FinanceJournalStatus, "neutral" | "success" | "warning" | "error"> = {
  DRAFT: "neutral",
  POSTED: "success",
  REVERSED: "warning",
  VOIDED: "error",
};

export function JournalListPage() {
  const { data, isLoading, isError, error, refetch } = useJournals();
  const [showCreate, setShowCreate] = useState(false);

  const createAction = (
    <PermissionGuard permission="finance.journal.create">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Journal
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading journals..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const journals = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Journal</h1>
        {createAction}
      </div>

      {journals.length === 0 ? (
        <EmptyState title="No journals yet" description="Create the first manual journal entry." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Journal No.</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Total Debit</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {journals.map((journal) => (
              <TableRow key={journal.id}>
                <TableCell>{journal.journalNo ?? "—"}</TableCell>
                <TableCell>{new Date(journal.journalDate).toLocaleDateString()}</TableCell>
                <TableCell>{journal.description}</TableCell>
                <TableCell>
                  <Badge tone={JOURNAL_STATUS_TONE[journal.status]}>{journal.status}</Badge>
                </TableCell>
                <TableCell className="font-tabular">{formatCurrency(journal.debitTotal)}</TableCell>
                <TableCell>
                  <Link href={`/finance/journals/${journal.id}`} className="text-sm font-medium text-primary hover:underline">
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateJournalModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateJournalModal({ onClose }: { onClose: () => void }) {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: accountsData } = useQuery({ queryKey: ["finance", "accounts", "options"], queryFn: () => accountService.list() });
  const [branchId, setBranchId] = useState("");
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLineEntry[]>([
    { accountId: "", debit: 0, credit: 0 },
    { accountId: "", debit: 0, credit: 0 },
  ]);
  const createJournal = useCreateJournal();

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  function updateLine(index: number, patch: Partial<JournalLineEntry>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { accountId: "", debit: 0, credit: 0 }]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || !description.trim() || !isBalanced) return;
    const validLines = lines.filter((l) => l.accountId && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) return;
    createJournal.mutate({ branchId, journalDate, description, lines: validLines }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title="New Journal" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="journalBranch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
          <option value="">Select a branch</option>
          {branchesData?.items.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName}
            </option>
          ))}
        </Select>
        <Input id="journalDate" label="Journal Date" type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} required />
        <Input id="journalDescription" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Lines</span>
          {lines.map((line, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2">
              <Select
                id={`journalLineAccount-${index}`}
                label="Account"
                value={line.accountId}
                onChange={(e) => updateLine(index, { accountId: e.target.value })}
                className="min-w-48"
              >
                <option value="">Select an account</option>
                {accountsData?.items
                  .filter((a) => a.isPostable)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
              </Select>
              <Input
                id={`journalLineDebit-${index}`}
                label="Debit"
                type="number"
                min={0}
                value={line.debit || ""}
                onChange={(e) => updateLine(index, { debit: Number(e.target.value), credit: 0 })}
                className="w-28"
              />
              <Input
                id={`journalLineCredit-${index}`}
                label="Credit"
                type="number"
                min={0}
                value={line.credit || ""}
                onChange={(e) => updateLine(index, { credit: Number(e.target.value), debit: 0 })}
                className="w-28"
              />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addLine} className="self-start">
            <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
            Add Line
          </Button>
        </div>

        <div className="flex justify-between rounded-md border border-border p-2 font-tabular text-sm">
          <span>Total Debit: {formatCurrency(totalDebit)}</span>
          <span>Total Credit: {formatCurrency(totalCredit)}</span>
        </div>
        {!isBalanced && totalDebit + totalCredit > 0 && <p className="text-xs text-error">Debit and credit totals must be equal before this journal can be created.</p>}

        {createJournal.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createJournal.error)}
          </p>
        )}
        <Button type="submit" isLoading={createJournal.isPending} disabled={!branchId || !description.trim() || !isBalanced}>
          Create Journal
        </Button>
      </form>
    </Modal>
  );
}
