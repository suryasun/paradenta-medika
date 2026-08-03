"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Calculator, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { branchService } from "@/features/master-data/services/branch.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { accountService } from "../services/finance.service";
import { useCashAccounts } from "../hooks/useAccounts";
import { useApproveDoctorFeeSettlement, useGenerateDoctorFeeSettlement, usePayDoctorFeeSettlement } from "../hooks/useDoctorFeeSettlement";
import { DoctorFeeSettlement } from "../types/finance.types";

// finance.routes.ts has no GET/list route for this resource (confirmed) --
// this page holds the just-generated settlement in local state and drives
// Approve/Pay from it, same fallback as Stock Transfer/Adjustment.
export function DoctorFeeSettlementPage() {
  const [settlement, setSettlement] = useState<DoctorFeeSettlement | null>(null);
  const [showPay, setShowPay] = useState(false);
  const approveSettlement = useApproveDoctorFeeSettlement();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-foreground">Doctor Fee Settlement</h1>
      <p className="text-sm text-muted">
        No settlement list exists yet on the backend — generate a settlement below and its Approve/Pay actions stay available on this page until you
        navigate away.
      </p>

      {!settlement ? (
        <GenerateSettlementForm onGenerated={setSettlement} />
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{settlement.settlementNo}</h2>
            <Badge tone={settlement.status === "PAID" ? "success" : settlement.status === "APPROVED" ? "info" : "neutral"}>{settlement.status}</Badge>
          </div>

          {approveSettlement.isError && (
            <p role="alert" className="text-sm text-error">
              {getApiErrorMessage(approveSettlement.error)}
            </p>
          )}

          <div className="grid grid-cols-3 gap-4">
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

          <div className="flex gap-2">
            {settlement.status === "DRAFT" && (
              <PermissionGuard permission="finance.settlement.approve">
                <Button isLoading={approveSettlement.isPending} onClick={() => approveSettlement.mutate(settlement.id, { onSuccess: setSettlement })}>
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
            {settlement.status === "PAID" && <p className="text-sm text-success">Settlement paid.</p>}
          </div>
        </div>
      )}

      {showPay && settlement && (
        <PaySettlementModal settlement={settlement} onClose={() => setShowPay(false)} onPaid={(updated) => { setSettlement(updated); setShowPay(false); }} />
      )}
    </div>
  );
}

function GenerateSettlementForm({ onGenerated }: { onGenerated: (settlement: DoctorFeeSettlement) => void }) {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: doctorsData } = useQuery({ queryKey: ["master-data", "doctors", "options"], queryFn: () => doctorService.list() });
  const { data: accountsData } = useQuery({ queryKey: ["finance", "accounts", "options"], queryFn: () => accountService.list() });
  const [branchId, setBranchId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [feeAccountId, setFeeAccountId] = useState("");
  const generateSettlement = useGenerateDoctorFeeSettlement();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || !doctorId || !periodStart || !periodEnd || !feeAccountId) return;
    generateSettlement.mutate({ branchId, doctorId, periodStart, periodEnd, feeAccountId }, { onSuccess: (settlement) => onGenerated(settlement) });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3 rounded-lg border border-border p-4">
      <Select id="settlementBranch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
        <option value="">Select a branch</option>
        {branchesData?.items.map((b) => (
          <option key={b.id} value={b.id}>
            {b.branchName}
          </option>
        ))}
      </Select>
      <Select id="settlementDoctor" label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
        <option value="">Select a doctor</option>
        {doctorsData?.items.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.fullName}
          </option>
        ))}
      </Select>
      <Input id="settlementPeriodStart" label="Period Start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
      <Input id="settlementPeriodEnd" label="Period End" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
      <Select id="settlementFeeAccount" label="Fee Account" value={feeAccountId} onChange={(e) => setFeeAccountId(e.target.value)} required>
        <option value="">Select an account</option>
        {accountsData?.items.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code} — {a.name}
          </option>
        ))}
      </Select>

      {generateSettlement.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(generateSettlement.error)}
        </p>
      )}
      <Button type="submit" isLoading={generateSettlement.isPending} disabled={!branchId || !doctorId || !periodStart || !periodEnd || !feeAccountId}>
        <Calculator size={14} strokeWidth={1.75} aria-hidden="true" />
        Generate Settlement
      </Button>
    </form>
  );
}

function PaySettlementModal({
  settlement,
  onClose,
  onPaid,
}: {
  settlement: DoctorFeeSettlement;
  onClose: () => void;
  onPaid: (settlement: DoctorFeeSettlement) => void;
}) {
  const { data: cashAccountsData } = useCashAccounts();
  const [cashAccountId, setCashAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const paySettlement = usePayDoctorFeeSettlement();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cashAccountId) return;
    paySettlement.mutate({ id: settlement.id, payload: { cashAccountId, paymentDate } }, { onSuccess: onPaid });
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
