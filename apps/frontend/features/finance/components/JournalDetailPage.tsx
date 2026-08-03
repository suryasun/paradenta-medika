"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useAuthStore } from "@/stores/auth.store";
import { accountService } from "../services/finance.service";
import { useJournal, usePostJournal, useReverseJournal, useVoidJournal } from "../hooks/useJournal";
import { JOURNAL_STATUS_TONE } from "./JournalListPage";

export function JournalDetailPage({ journalId }: { journalId: string }) {
  const { data: journal, isLoading, isError, error, refetch } = useJournal(journalId);
  const { data: accountsData } = useQuery({ queryKey: ["finance", "accounts", "options"], queryFn: () => accountService.list() });
  const currentUserId = useAuthStore((s) => s.user?.id);
  const postJournal = usePostJournal(journalId);
  const reverseJournal = useReverseJournal(journalId);
  const voidJournal = useVoidJournal(journalId);
  const [showReverse, setShowReverse] = useState(false);
  const [showVoid, setShowVoid] = useState(false);

  if (isLoading) return <LoadingState label="Loading journal..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!journal) return null;

  const accountLabel = (id: string) => {
    const account = accountsData?.items.find((a) => a.id === id);
    return account ? `${account.code} — ${account.name}` : id;
  };

  const isOwnDraft = journal.createdBy === currentUserId;
  const mutationError = postJournal.error ?? reverseJournal.error ?? voidJournal.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{journal.journalNo ?? "Draft Journal"}</h1>
          <Badge tone={JOURNAL_STATUS_TONE[journal.status]}>{journal.status}</Badge>
        </div>
        <div className="flex gap-2">
          {journal.status === "DRAFT" && (
            <>
              <PermissionGuard permission="finance.journal.post">
                <Button
                  isLoading={postJournal.isPending}
                  onClick={() => postJournal.mutate()}
                  disabled={isOwnDraft}
                  title={isOwnDraft ? "You created this journal — a different Finance Manager must post it" : undefined}
                >
                  <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
                  Post
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="finance.journal.void">
                <Button variant="danger" onClick={() => setShowVoid(true)}>
                  <XCircle size={14} strokeWidth={1.75} aria-hidden="true" />
                  Void
                </Button>
              </PermissionGuard>
            </>
          )}
          {journal.status === "POSTED" && (
            <PermissionGuard permission="finance.journal.reverse">
              <Button variant="secondary" onClick={() => setShowReverse(true)}>
                <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
                Reverse
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
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Date</span>
          <p className="font-tabular text-sm text-foreground">{new Date(journal.journalDate).toLocaleDateString()}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Reference</span>
          <p className="text-sm text-foreground">{journal.referenceType ? `${journal.referenceType} #${journal.referenceId?.slice(0, 8)}` : "Manual"}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Total Debit</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(journal.debitTotal)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Total Credit</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(journal.creditTotal)}</p>
        </div>
      </div>

      <p className="text-sm text-foreground">{journal.description}</p>
      {journal.voidReason && <p className="text-sm text-error">Voided: {journal.voidReason}</p>}
      {journal.reverseReason && <p className="text-sm text-muted">Reversed: {journal.reverseReason}</p>}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Journal Lines</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Account</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Debit</TableHeaderCell>
              <TableHeaderCell>Credit</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {journal.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{accountLabel(line.accountId)}</TableCell>
                <TableCell>{line.description ?? "-"}</TableCell>
                <TableCell className="font-tabular">{line.debit > 0 ? formatCurrency(line.debit) : "-"}</TableCell>
                <TableCell className="font-tabular">{line.credit > 0 ? formatCurrency(line.credit) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showReverse && (
        <ReverseJournalModal
          isLoading={reverseJournal.isPending}
          onSubmit={(payload) => reverseJournal.mutate(payload, { onSuccess: () => setShowReverse(false) })}
          onClose={() => setShowReverse(false)}
        />
      )}
      {showVoid && (
        <VoidJournalModal isLoading={voidJournal.isPending} onSubmit={(reason) => voidJournal.mutate(reason, { onSuccess: () => setShowVoid(false) })} onClose={() => setShowVoid(false)} />
      )}
    </div>
  );
}

function ReverseJournalModal({
  isLoading,
  onSubmit,
  onClose,
}: {
  isLoading: boolean;
  onSubmit: (payload: { journalDate: string; reason: string }) => void;
  onClose: () => void;
}) {
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) return;
    onSubmit({ journalDate, reason: reason.trim() });
  }

  return (
    <Modal title="Reverse Journal" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="reverseDate" label="Reversal Date" type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} required />
        <Input id="reverseReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
        <Button type="submit" isLoading={isLoading} disabled={!reason.trim()}>
          Confirm Reversal
        </Button>
      </form>
    </Modal>
  );
}

function VoidJournalModal({ isLoading, onSubmit, onClose }: { isLoading: boolean; onSubmit: (reason?: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(reason.trim() || undefined);
  }

  return (
    <Modal title="Void Journal" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="voidReason" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button type="submit" variant="danger" isLoading={isLoading}>
          Confirm Void
        </Button>
      </form>
    </Modal>
  );
}
