"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminEntityListPage } from "@/features/master-data/components/AdminEntityListPage";
import { FieldConfig } from "@/features/master-data/lib/fieldConfig";
import { branchService } from "@/features/master-data/services/branch.service";
import { LoadingState } from "@/components/ui/LoadingState";
import { warehouseLocationService } from "../services/warehouse.service";
import { WarehouseLocation } from "../types/warehouse.types";

export function WarehouseLocationsAdminPage() {
  const { data: branchesData, isLoading } = useQuery({
    queryKey: ["master-data", "branches", "options"],
    queryFn: () => branchService.list(),
  });

  if (isLoading) return <LoadingState label="Loading..." />;

  const fields: FieldConfig[] = [
    { name: "code", label: "Location Code", type: "text", required: true, createOnly: true },
    { name: "name", label: "Location Name", type: "text", required: true },
    {
      name: "branchId",
      label: "Branch",
      type: "select",
      required: true,
      options: branchesData?.items.map((branch) => ({ value: branch.id, label: branch.branchName })) ?? [],
    },
    { name: "locationType", label: "Location Type", type: "text" },
    { name: "address", label: "Address", type: "text" },
  ];

  return (
    <AdminEntityListPage<WarehouseLocation>
      title="Warehouse Locations"
      resourceKey="warehouse-locations"
      permissionPrefix="warehouse.location"
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "locationType", label: "Type" },
      ]}
      fields={fields}
      service={warehouseLocationService}
    />
  );
}
