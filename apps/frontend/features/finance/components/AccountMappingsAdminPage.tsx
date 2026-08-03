"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { branchService } from "@/features/master-data/services/branch.service";
import { paymentMethodService } from "@/features/master-data/services/paymentMethod.service";
import { accountService, cashAccountService, financeAccountMappingService } from "../services/finance.service";

// finance.md §11: no PATCH/deactivate route exists server-side for this
// resource (create/list/findById only, confirmed) -- list + create only,
// deliberately no Edit action, unlike every other catalog in this app.
export function AccountMappingsAdminPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["finance", "account-mappings", "list"],
    queryFn: () => financeAccountMappingService.list(),
  });
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: paymentMethodsData } = useQuery({ queryKey: ["master-data", "payment-methods", "options"], queryFn: () => paymentMethodService.list() });
  const { data: cashAccountsData } = useQuery({ queryKey: ["finance", "cash-accounts", "options"], queryFn: () => cashAccountService.list() });
  const { data: accountsData } = useQuery({ queryKey: ["finance", "accounts", "options"], queryFn: () => accountService.list() });

  const branchName = (id: string) => branchesData?.items.find((b) => b.id === id)?.branchName ?? id;
  const paymentMethodName = (id: string) => paymentMethodsData?.items.find((p) => p.id === id)?.methodName ?? id;
  const cashAccountName = (id: string) => cashAccountsData?.items.find((c) => c.id === id)?.name ?? id;
  const accountName = (id: string) => accountsData?.items.find((a) => a.id === id)?.name ?? id;

  const createAction = (
    <PermissionGuard permission="finance.account-mapping.manage">
      <Button onClick={() => setShowCreate(true)}>New Mapping</Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading account mappings..." rows={3} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const mappings = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Account Mappings</h1>
        {createAction}
      </div>

      {mappings.length === 0 ? (
        <EmptyState title="No account mappings yet" description="Map a payment method to its cash and revenue accounts." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Branch</TableHeaderCell>
              <TableHeaderCell>Payment Method</TableHeaderCell>
              <TableHeaderCell>Cash Account</TableHeaderCell>
              <TableHeaderCell>Revenue Account</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mappings.map((mapping) => (
              <TableRow key={mapping.id}>
                <TableCell>{branchName(mapping.branchId)}</TableCell>
                <TableCell>{paymentMethodName(mapping.paymentMethodId)}</TableCell>
                <TableCell>{cashAccountName(mapping.cashAccountId)}</TableCell>
                <TableCell>{accountName(mapping.revenueAccountId)}</TableCell>
                <TableCell>
                  <Badge tone={mapping.isActive ? "success" : "neutral"}>{mapping.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && (
        <CreateMappingModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["finance", "account-mappings"] })}
        />
      )}
    </div>
  );
}

function CreateMappingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: branchesData } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: paymentMethodsData } = useQuery({ queryKey: ["master-data", "payment-methods", "options"], queryFn: () => paymentMethodService.list() });
  const { data: cashAccountsData } = useQuery({ queryKey: ["finance", "cash-accounts", "options"], queryFn: () => cashAccountService.list() });
  const { data: accountsData } = useQuery({ queryKey: ["finance", "accounts", "options"], queryFn: () => accountService.list() });
  const [branchId, setBranchId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");

  const createMapping = useMutation({
    mutationFn: financeAccountMappingService.create,
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchId || !paymentMethodId || !cashAccountId || !revenueAccountId) return;
    createMapping.mutate({ branchId, paymentMethodId, cashAccountId, revenueAccountId });
  }

  return (
    <Modal title="New Account Mapping" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="mappingBranch" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
          <option value="">Select a branch</option>
          {branchesData?.items.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName}
            </option>
          ))}
        </Select>
        <Select id="mappingPaymentMethod" label="Payment Method" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} required>
          <option value="">Select a payment method</option>
          {paymentMethodsData?.items.map((p) => (
            <option key={p.id} value={p.id}>
              {p.methodName}
            </option>
          ))}
        </Select>
        <Select id="mappingCashAccount" label="Cash Account" value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} required>
          <option value="">Select a cash account</option>
          {cashAccountsData?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select id="mappingRevenueAccount" label="Revenue Account" value={revenueAccountId} onChange={(e) => setRevenueAccountId(e.target.value)} required>
          <option value="">Select a revenue account</option>
          {accountsData?.items.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>
        {createMapping.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createMapping.error)}
          </p>
        )}
        <Button type="submit" isLoading={createMapping.isPending} disabled={!branchId || !paymentMethodId || !cashAccountId || !revenueAccountId}>
          Create Mapping
        </Button>
      </form>
    </Modal>
  );
}
