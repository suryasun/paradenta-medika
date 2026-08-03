"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCreateReferral, useReferrals } from "../hooks/useReferralAndFollowUp";
import { REFERRAL_TARGET_TYPES, ReferralTargetType } from "../types/emr.types";

// docs/06-tasks/task-089.md.
export function ReferralSection({ visitId, readOnly }: { visitId: string; readOnly: boolean }) {
  const { data: referrals, isLoading, isError, error, refetch } = useReferrals(visitId);
  const [targetType, setTargetType] = useState<ReferralTargetType>("SPECIALIST");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const createReferral = useCreateReferral(visitId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) return;
    createReferral.mutate(
      { targetType, reason, note: note || undefined },
      { onSuccess: () => { setReason(""); setNote(""); } },
    );
  }

  if (isLoading) return <LoadingState label="Loading referrals..." rows={3} columns={3} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!referrals || referrals.length === 0 ? (
        <EmptyState
          title="No referrals recorded yet"
          description={!readOnly ? "Use the form below to refer this patient." : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Target</TableHeaderCell>
              <TableHeaderCell>Reason</TableHeaderCell>
              <TableHeaderCell>Note</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>{referral.targetType}</TableCell>
                <TableCell>{referral.reason}</TableCell>
                <TableCell>{referral.note ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.referral.create">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <Select id="referralTargetType" label="Refer To" value={targetType} onChange={(e) => setTargetType(e.target.value as ReferralTargetType)}>
              {REFERRAL_TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Textarea id="referralReason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Textarea id="referralNote" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            {createReferral.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(createReferral.error)}
              </p>
            )}
            <Button type="submit" isLoading={createReferral.isPending} disabled={!reason.trim()} className="self-start">
              <Send size={14} strokeWidth={1.75} aria-hidden="true" />
              Create Referral
            </Button>
          </form>
        </PermissionGuard>
      )}
    </div>
  );
}
