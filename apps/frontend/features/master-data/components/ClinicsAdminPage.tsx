"use client";

import { clinicService, Clinic } from "../services/clinic.service";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

const FIELDS: FieldConfig[] = [
  { name: "clinicCode", label: "Clinic Code", type: "text", required: true, createOnly: true },
  { name: "clinicName", label: "Clinic Name", type: "text", required: true },
  { name: "legalName", label: "Legal Name", type: "text", required: true },
  { name: "taxNumber", label: "Tax Number (NPWP)", type: "text", required: true },
  { name: "ownerName", label: "Owner Name", type: "text" },
  { name: "phone", label: "Phone", type: "text", required: true },
  { name: "email", label: "Email", type: "text", required: true },
  { name: "address", label: "Address", type: "text", required: true },
];

export function ClinicsAdminPage() {
  return (
    <AdminEntityListPage<Clinic>
      title="Clinics"
      resourceKey="clinics"
      permissionPrefix="masterdata.clinic"
      columns={[
        { key: "clinicCode", label: "Code" },
        { key: "clinicName", label: "Name" },
        { key: "phone", label: "Phone" },
      ]}
      fields={FIELDS}
      service={clinicService}
    />
  );
}
