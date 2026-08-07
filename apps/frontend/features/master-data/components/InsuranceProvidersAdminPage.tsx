"use client";

import { insuranceProviderService } from "../services/insuranceProvider.service";
import { InsuranceProvider } from "../types/masterData.types";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

const FIELDS: FieldConfig[] = [{ name: "providerName", label: "Provider Name", type: "text", required: true }];

// docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md
export function InsuranceProvidersAdminPage() {
  return (
    <AdminEntityListPage<InsuranceProvider>
      title="Insurance Providers"
      resourceKey="insurance-providers"
      permissionPrefix="masterdata.insurance-provider"
      columns={[{ key: "providerName", label: "Provider Name" }]}
      fields={FIELDS}
      service={insuranceProviderService}
    />
  );
}
