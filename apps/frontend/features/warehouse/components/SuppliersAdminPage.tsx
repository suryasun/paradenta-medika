"use client";

import { AdminEntityListPage } from "@/features/master-data/components/AdminEntityListPage";
import { FieldConfig } from "@/features/master-data/lib/fieldConfig";
import { supplierService } from "../services/warehouse.service";
import { Supplier } from "../types/warehouse.types";

const fields: FieldConfig[] = [
  { name: "code", label: "Supplier Code", type: "text", required: true, createOnly: true },
  { name: "name", label: "Supplier Name", type: "text", required: true },
  { name: "picName", label: "Contact Person", type: "text" },
  { name: "phone", label: "Phone", type: "text" },
  { name: "address", label: "Address", type: "text" },
  { name: "taxNumber", label: "NPWP", type: "text" },
];

export function SuppliersAdminPage() {
  return (
    <AdminEntityListPage<Supplier>
      title="Suppliers"
      resourceKey="warehouse-suppliers"
      permissionPrefix="warehouse.supplier"
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "picName", label: "Contact Person" },
        { key: "phone", label: "Phone" },
      ]}
      fields={fields}
      service={supplierService}
    />
  );
}
