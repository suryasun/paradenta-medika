"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
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
import { doctorService } from "@/features/master-data/services/doctor.service";
import { accountService } from "../services/finance.service";
import { useDoctorFeeSettlements, useGenerateDoctorFeeSettlement } from "../hooks/useDoctorFeeSettlement";
import { DoctorFeeSettlementStatus } from "../types/finance.types";

export const SETTLEMENT_STATUS_TONE: Record<DoctorFeeSettlementStatus, "neutral" | "info" | "success" | "error"> = {
  DRAFT: "neutral",
  APPROVED: "info",
  PAID: "success",
  CANCELLED: "error",
};

export function DoctorFeeSettlementListPage() {
  const { data, isLoading, isError, error, refetch } = useDoctorFeeSettlements();
  const { data: doctorsData } = useQuery({ queryKey: ["master-data", "doctors", "options"], queryFn: () => doctorService.list() });
  const [showGenerate, setShowGenerate] = useState(false);

  const doctorName = (id: string) => doctorsData?.items.find((d) => d.id === id)?.fullName ?? id;

  const generateAction = (
    <PermissionGuard permission="finance.settlement.generate">
      <Button onClick={() => setShowGenerate(true)}>
        <Calculator size={14} strokeWidth={1.75} aria-hidden="true" />
        Generate Settlement
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading doctor fee settlements..." rows={4} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const settlements = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Doctor Fee Settlements</h1>
        {generateAction}
      </div>

      {settlements.length === 0 ? (
        <EmptyState title="No settlements generated yet" description="Generate the first doctor fee settlement." action={generateAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Settlement No.</TableHeaderCell>
              <TableHeaderCell>Doctor</TableHeaderCell>
              <TableHeaderCell>Period</TableHeaderCell>
              <TableHeaderCell>Net Amount</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settlements.map((settlement) => (
              <TableRow key={settlement.id}>
                <TableCell>{settlement.settlementNo}</TableCell>
                <TableCell>{doctorName(settlement.doctorId)}</TableCell>
                <TableCell>
                  {new Date(settlement.periodStart).toLocaleDateString()} – {new Date(settlement.periodEnd).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-tabular">{formatCurrency(settlement.netAmount)}</TableCell>
                <TableCell>
                  <Badge tone={SETTLEMENT_STATUS_TONE[settlement.status]}>{settlement.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/finance/doctor-fee-settlements/${settlement.id}`} className="text-sm font-medium text-primary hover:underline">
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showGenerate && <GenerateSettlementModal onClose={() => setShowGenerate(false)} />}
    </div>
  );
}

function GenerateSettlementModal({ onClose }: { onClose: () => void }) {
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
    generateSettlement.mutate({ branchId, doctorId, periodStart, periodEnd, feeAccountId }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title="Generate Doctor Fee Settlement" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          Generate Settlement
        </Button>
      </form>
    </Modal>
  );
}
