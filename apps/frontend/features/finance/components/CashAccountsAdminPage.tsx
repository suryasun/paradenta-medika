"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminEntityListPage } from "@/features/master-data/components/AdminEntityListPage";
import { FieldConfig } from "@/features/master-data/lib/fieldConfig";
import { branchService } from "@/features/master-data/services/branch.service";
import { LoadingState } from "@/components/ui/LoadingState";
import { accountService, cashAccountService } from "../services/finance.service";
import { CashAccount } from "../types/finance.types";
import { formatCurrency } from "@/utils/currency";

const ACCOUNT_TYPES = ["cash", "bank", "clearing"];

export function CashAccountsAdminPage() {
  const { data: branchesData, isLoading: branchesLoading } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });
  const { data: accountsData, isLoading: accountsLoading } = useQuery({ queryKey: ["finance", "accounts", "options"], queryFn: () => accountService.list() });

  if (branchesLoading || accountsLoading) return <LoadingState label="Loading..." />;

  const fields: FieldConfig[] = [
    { name: "code", label: "Cash Account Code", type: "text", required: true, createOnly: true },
    { name: "name", label: "Cash Account Name", type: "text", required: true },
    { name: "accountType", label: "Type", type: "select", required: true, options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t })) },
    {
      name: "branchId",
      label: "Branch",
      type: "select",
      required: true,
      options: branchesData?.items.map((b) => ({ value: b.id, label: b.branchName })) ?? [],
    },
    {
      name: "ledgerAccountId",
      label: "Ledger Account",
      type: "select",
      required: true,
      options: accountsData?.items.map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })) ?? [],
    },
    { name: "accountNumber", label: "Account Number (optional)", type: "text" },
  ];

  return (
    <AdminEntityListPage<CashAccount>
      title="Cash & Bank Accounts"
      resourceKey="finance-cash-accounts"
      permissionPrefix="finance.cash"
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "accountType", label: "Type" },
        { key: "currentBalance", label: "Balance", render: (item) => formatCurrency(item.currentBalance) },
      ]}
      fields={fields}
      service={cashAccountService}
    />
  );
}
