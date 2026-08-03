"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminEntityListPage } from "@/features/master-data/components/AdminEntityListPage";
import { FieldConfig } from "@/features/master-data/lib/fieldConfig";
import { branchService } from "@/features/master-data/services/branch.service";
import { LoadingState } from "@/components/ui/LoadingState";
import { accountService } from "../services/finance.service";
import { Account } from "../types/finance.types";

const ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"];
const NORMAL_BALANCES = ["debit", "credit"];

export function AccountsAdminPage() {
  const { data: branchesData, isLoading } = useQuery({ queryKey: ["master-data", "branches", "options"], queryFn: () => branchService.list() });

  if (isLoading) return <LoadingState label="Loading..." />;

  const fields: FieldConfig[] = [
    { name: "code", label: "Account Code", type: "text", required: true, createOnly: true },
    { name: "name", label: "Account Name", type: "text", required: true },
    { name: "accountType", label: "Account Type", type: "select", required: true, options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t })) },
    { name: "normalBalance", label: "Normal Balance", type: "select", required: true, options: NORMAL_BALANCES.map((b) => ({ value: b, label: b })) },
    {
      name: "branchId",
      label: "Branch (optional — blank = shared across branches)",
      type: "select",
      options: branchesData?.items.map((b) => ({ value: b.id, label: b.branchName })) ?? [],
    },
    { name: "isPostable", label: "Postable (allows journal lines)", type: "boolean" },
  ];

  return (
    <AdminEntityListPage<Account>
      title="Chart of Accounts"
      resourceKey="finance-accounts"
      permissionPrefix="finance.account"
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "accountType", label: "Type" },
        { key: "normalBalance", label: "Normal Balance" },
      ]}
      fields={fields}
      service={accountService}
    />
  );
}
