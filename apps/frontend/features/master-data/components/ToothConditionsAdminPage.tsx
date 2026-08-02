"use client";

import { toothConditionService } from "../services/toothCondition.service";
import { ToothCondition } from "../types/masterData.types";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

const CATEGORY_OPTIONS = [
  { value: "HEALTHY", label: "Healthy" },
  { value: "DISEASE", label: "Disease" },
  { value: "RESTORATION", label: "Restoration" },
  { value: "PROSTHODONTIC", label: "Prosthodontic" },
  { value: "ENDODONTIC", label: "Endodontic" },
  { value: "SURGICAL", label: "Surgical" },
  { value: "ORTHODONTIC", label: "Orthodontic" },
  { value: "IMPLANTOLOGY", label: "Implantology" },
];

const FIELDS: FieldConfig[] = [
  { name: "conditionCode", label: "Condition Code", type: "text", required: true, createOnly: true },
  { name: "conditionName", label: "Condition Name", type: "text", required: true },
  { name: "category", label: "Category", type: "select", required: true, options: CATEGORY_OPTIONS },
  { name: "colorCode", label: "Color", type: "text" },
];

// docs/06-tasks/task-067.md: "Tooth Condition reference list (settings
// page); consumed as a dropdown/legend by the Odontogram UI (task-069)."
export function ToothConditionsAdminPage() {
  return (
    <AdminEntityListPage<ToothCondition>
      title="Tooth Conditions"
      resourceKey="tooth-conditions"
      permissionPrefix="masterdata.tooth-condition"
      columns={[
        { key: "conditionCode", label: "Code" },
        { key: "conditionName", label: "Name" },
        { key: "category", label: "Category" },
        { key: "colorCode", label: "Color" },
      ]}
      fields={FIELDS}
      service={toothConditionService}
    />
  );
}
