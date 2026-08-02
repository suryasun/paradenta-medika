"use client";

import { treatmentCategoryService, TreatmentCategory } from "../services/treatmentCategory.service";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

const FIELDS: FieldConfig[] = [
  { name: "categoryCode", label: "Category Code", type: "text", required: true, createOnly: true },
  { name: "categoryName", label: "Category Name", type: "text", required: true },
];

export function TreatmentCategoriesAdminPage() {
  return (
    <AdminEntityListPage<TreatmentCategory>
      title="Treatment Categories"
      resourceKey="treatment-categories"
      permissionPrefix="masterdata.treatment-category"
      columns={[
        { key: "categoryCode", label: "Code" },
        { key: "categoryName", label: "Name" },
      ]}
      fields={FIELDS}
      service={treatmentCategoryService}
    />
  );
}
