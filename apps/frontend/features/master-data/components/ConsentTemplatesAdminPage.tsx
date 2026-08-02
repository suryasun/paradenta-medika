"use client";

import { consentTemplateService } from "../services/consentTemplate.service";
import { ConsentTemplate } from "../types/masterData.types";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

const CATEGORY_OPTIONS = [
  { value: "GENERAL", label: "General" },
  { value: "CLINICAL", label: "Clinical" },
  { value: "SURGICAL", label: "Surgical" },
];

const FIELDS: FieldConfig[] = [
  { name: "category", label: "Category", type: "select", required: true, options: CATEGORY_OPTIONS },
  { name: "title", label: "Title", type: "text", required: true },
  { name: "body", label: "Body", type: "text", required: true },
];

// docs/06-tasks/task-085.md: "Consent template management (settings page,
// Administrator only)."
export function ConsentTemplatesAdminPage() {
  return (
    <AdminEntityListPage<ConsentTemplate>
      title="Consent Templates"
      resourceKey="consent-templates"
      permissionPrefix="emr.consent-template"
      columns={[
        { key: "category", label: "Category" },
        { key: "title", label: "Title" },
      ]}
      fields={FIELDS}
      service={consentTemplateService}
    />
  );
}
