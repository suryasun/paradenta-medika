"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/ui/LoadingState";
import { branchService, Branch } from "../services/branch.service";
import { clinicService } from "../services/clinic.service";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

export function BranchesAdminPage() {
  const { data: clinicsData, isLoading } = useQuery({
    queryKey: ["master-data", "clinics", "options"],
    queryFn: () => clinicService.list(),
  });

  if (isLoading) return <LoadingState label="Loading..." />;

  const fields: FieldConfig[] = [
    {
      name: "clinicId",
      label: "Clinic",
      type: "select",
      required: true,
      createOnly: true,
      options: clinicsData?.items.map((clinic) => ({ value: clinic.id, label: clinic.clinicName })) ?? [],
    },
    { name: "branchCode", label: "Branch Code", type: "text", required: true, createOnly: true },
    { name: "branchName", label: "Branch Name", type: "text", required: true },
    { name: "phone", label: "Phone", type: "text", required: true },
    { name: "email", label: "Email", type: "text", required: true },
    { name: "address", label: "Address", type: "text", required: true },
    { name: "timezone", label: "Timezone", type: "text" },
    // MRN scheme hardening: short, unique prefix MedicalRecordNumberGenerator
    // uses to build this branch's patient MRNs (e.g. "KM" -> KM260802001).
    { name: "mrnPrefix", label: "MRN Prefix", type: "text" },
  ];

  return (
    <AdminEntityListPage<Branch>
      title="Branches"
      resourceKey="branches"
      permissionPrefix="masterdata.branch"
      columns={[
        { key: "branchCode", label: "Code" },
        { key: "branchName", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "mrnPrefix", label: "MRN Prefix" },
      ]}
      fields={fields}
      service={branchService}
      extraRowActions={(branch) => (
        <Link href={`/master-data/branches/${branch.id}/configuration`} className="text-sm font-medium text-primary hover:underline">
          Configuration
        </Link>
      )}
    />
  );
}
