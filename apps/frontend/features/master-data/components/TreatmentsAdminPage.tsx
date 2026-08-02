"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/ui/LoadingState";
import { treatmentService } from "../services/treatment.service";
import { treatmentCategoryService } from "../services/treatmentCategory.service";
import { Treatment } from "../types/masterData.types";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";
import { formatCurrency } from "@/utils/currency";

export function TreatmentsAdminPage() {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["master-data", "treatment-categories", "options"],
    queryFn: () => treatmentCategoryService.list(),
  });

  if (isLoading) return <LoadingState label="Loading..." />;

  const fields: FieldConfig[] = [
    { name: "treatmentCode", label: "Treatment Code", type: "text", required: true, createOnly: true },
    { name: "treatmentName", label: "Treatment Name", type: "text", required: true },
    {
      name: "treatmentCategoryId",
      label: "Category",
      type: "select",
      required: true,
      options: categoriesData?.items.map((category) => ({ value: category.id, label: category.categoryName })) ?? [],
    },
    { name: "durationMinute", label: "Duration (minutes)", type: "number" },
    { name: "defaultPrice", label: "Default Price", type: "number", required: true },
    { name: "doctorFee", label: "Doctor Fee", type: "number" },
  ];

  return (
    <AdminEntityListPage<Treatment>
      title="Treatments"
      resourceKey="treatments"
      permissionPrefix="masterdata.treatment"
      columns={[
        { key: "treatmentCode", label: "Code" },
        { key: "treatmentName", label: "Name" },
        { key: "defaultPrice", label: "Price", render: (item) => formatCurrency(item.defaultPrice) },
      ]}
      fields={fields}
      service={treatmentService}
    />
  );
}
