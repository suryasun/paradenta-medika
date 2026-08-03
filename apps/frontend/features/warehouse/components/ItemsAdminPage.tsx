"use client";

import { AdminEntityListPage } from "@/features/master-data/components/AdminEntityListPage";
import { FieldConfig } from "@/features/master-data/lib/fieldConfig";
import { formatCurrency } from "@/utils/currency";
import { itemService } from "../services/warehouse.service";
import { Item } from "../types/warehouse.types";

// warehouse.routes.ts has no /warehouse/item-categories or /warehouse/units
// endpoint (confirmed absent, not overlooked) -- Item.categoryId/unitId
// stay plain UUID text inputs rather than a select with invented options.
const fields: FieldConfig[] = [
  { name: "code", label: "Item Code", type: "text", required: true, createOnly: true },
  { name: "name", label: "Item Name", type: "text", required: true },
  { name: "categoryId", label: "Category ID (UUID)", type: "text", required: true },
  { name: "unitId", label: "Unit ID (UUID)", type: "text", required: true },
  { name: "minimumStock", label: "Minimum Stock", type: "number", required: true },
  { name: "purchasePrice", label: "Purchase Price", type: "number" },
  { name: "sellingPrice", label: "Selling Price", type: "number" },
  { name: "isConsumable", label: "Consumable", type: "boolean" },
  { name: "isBatchTracked", label: "Batch Tracked", type: "boolean" },
  { name: "isExpiryTracked", label: "Expiry Tracked", type: "boolean" },
];

export function ItemsAdminPage() {
  return (
    <AdminEntityListPage<Item>
      title="Items"
      resourceKey="warehouse-items"
      permissionPrefix="warehouse.item"
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "minimumStock", label: "Min. Stock" },
        { key: "purchasePrice", label: "Purchase Price", render: (item) => (item.purchasePrice != null ? formatCurrency(item.purchasePrice) : "-") },
      ]}
      fields={fields}
      service={itemService}
    />
  );
}
