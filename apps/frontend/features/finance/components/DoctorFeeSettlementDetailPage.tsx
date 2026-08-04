"use client";

import { FormEvent, useState } from "react";
import { Banknote, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useCashAccounts } from "../hooks/useAccounts";
import { useApproveDoctorFeeSettlement, useDoctorFeeSettlement, usePayDoctorFeeSettlement } from "../hooks/useDoctorFeeSettlement";
import { SETTLEMENT_STATUS_TONE } from "./DoctorFeeSettlementListPage";

export function DoctorFeeSettlementDetailPage({ settlementId }: { settlementId: string }) {
  const { data: settlement, isLoading, isError, error, refetch } = useDoctorFeeSettlement(settlementId);
  const approveSettlement = useApproveDoctorFeeSettlement(settlementId);
  const paySettlement = usePayDoctorFeeSettlement(settlementId);
  const [showPay, setShowPay] = useState(false);

  if (isLoading) return <LoadingState label="Loading settlement..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!settlement) return null;

  const mutationError = approveSettlement.error ?? paySettlement.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{settlement.settlementNo}</h1>
          <Badge tone={SETTLEMENT_STATUS_TONE[settlement.status]}>{settlement.status}</Badge>
        </div>
        <div className="flex gap-2">
          {settlement.status === "DRAFT" && (
            <PermissionGuard permission="finance.settlement.approve">
              <Button isLoading={approveSettlement.isPending} onClick={() => approveSettlement.mutate()}>
                <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
                Approve
              </Button>
            </PermissionGuard>
          )}
          {settlement.status === "APPROVED" && (
            <PermissionGuard permission="finance.settlement.pay">
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
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Period</span>
          <p className="text-sm text-foreground">
            {new Date(settlement.periodStart).toLocaleDateString()} – {new Date(settlement.periodEnd).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Gross</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(settlement.grossAmount)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Deductions</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(settlement.deductions)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Net</span>
          <p className="font-tabular text-sm font-semibold text-foreground">{formatCurrency(settlement.netAmount)}</p>
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Visit Treatment</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {settlement.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.visitTreatmentId.slice(0, 8)}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(item.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {settlement.status === "PAID" && <p className="text-sm text-success">Settlement paid.</p>}

      {showPay && <PaySettlementModal settlementId={settlement.id} onClose={() => setShowPay(false)} />}
    </div>
  );
}

function PaySettlementModal({ settlementId, onClose }: { settlementId: string; onClose: () => void }) {
  const { data: cashAccountsData } = useCashAccounts();
  const [cashAccountId, setCashAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const paySettlement = usePayDoctorFeeSettlement(settlementId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cashAccountId) return;
    paySettlement.mutate({ cashAccountId, paymentDate }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title="Pay Settlement" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="paySettlementCashAccount" label="Cash Account" value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} required>
          <option value="">Select a cash account</option>
          {cashAccountsData?.items.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Input id="paySettlementDate" label="Payment Date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        {paySettlement.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(paySettlement.error)}
          </p>
        )}
        <Button type="submit" isLoading={paySettlement.isPending} disabled={!cashAccountId}>
          Confirm Payment
        </Button>
      </form>
    </Modal>
  );
}
