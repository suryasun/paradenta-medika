"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useItems, useSuppliers, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useCreatePurchaseOrder, usePurchaseOrders } from "../hooks/usePurchaseOrder";
import { PurchaseOrderItemEntry, PurchaseOrderStatus } from "../types/warehouse.types";

export const PO_STATUS_TONE: Record<PurchaseOrderStatus, "neutral" | "warning" | "success" | "error" | "info"> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED: "info",
  REJECTED: "error",
  CANCELLED: "error",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
};

export function PurchaseOrderListPage() {
  const { data, isLoading, isError, error, refetch } = usePurchaseOrders();
  const { data: suppliersData } = useSuppliers();
  const [showCreate, setShowCreate] = useState(false);

  const supplierName = (id: string) => suppliersData?.items.find((s) => s.id === id)?.name ?? id;

  const createAction = (
    <PermissionGuard permission="warehouse.purchase.create">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Purchase Order
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading purchase orders..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const orders = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Purchase Orders</h1>
        {createAction}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No purchase orders yet" description="Create the first purchase order to a supplier." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>PO Number</TableHeaderCell>
              <TableHeaderCell>Supplier</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((po) => (
              <TableRow key={po.id}>
                <TableCell>{po.purchaseOrderNumber}</TableCell>
                <TableCell>{supplierName(po.supplierId)}</TableCell>
                <TableCell>
                  <Badge tone={PO_STATUS_TONE[po.status]}>{po.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="font-tabular">{formatCurrency(po.totalAmount)}</TableCell>
                <TableCell>
                  <Link href={`/warehouse/purchase-orders/${po.id}`} className="text-sm font-medium text-primary hover:underline">
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreatePurchaseOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreatePurchaseOrderModal({ onClose }: { onClose: () => void }) {
  const { data: suppliersData } = useSuppliers();
  const { data: warehousesData } = useWarehouseLocations();
  const { data: itemsData } = useItems();
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [pending, setPending] = useState<PurchaseOrderItemEntry[]>([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const createPurchaseOrder = useCreatePurchaseOrder();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;

  function addPending() {
    if (!itemId || !quantity || !unitPrice) return;
    setPending((prev) => [...prev, { itemId, quantity: Number(quantity), unitPrice: Number(unitPrice) }]);
    setItemId("");
    setQuantity("");
    setUnitPrice("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplierId || !warehouseId || pending.length === 0) return;
    createPurchaseOrder.mutate(
      { supplierId, warehouseId, expectedDate: expectedDate || undefined, items: pending },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="New Purchase Order" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="poSupplier" label="Supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
          <option value="">Select a supplier</option>
          {suppliersData?.items.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select id="poWarehouse" label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
          <option value="">Select a warehouse</option>
          {warehousesData?.items.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Input id="poExpectedDate" label="Expected Date (optional)" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />

        <div className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-3">
          <Select id="poItemId" label="Item" value={itemId} onChange={(e) => setItemId(e.target.value)} className="min-w-40">
            <option value="">Select an item</option>
            {itemsData?.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
          <Input id="poQuantity" label="Qty" type="number" min={0.01} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
          <Input
            id="poUnitPrice"
            label="Unit Price"
            type="number"
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="w-32"
          />
          <Button type="button" variant="secondary" onClick={addPending} disabled={!itemId || !quantity || !unitPrice}>
            <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
            Add Line
          </Button>
        </div>

        {pending.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {pending.map((line, index) => (
              <li key={index}>
                {itemName(line.itemId)} — {line.quantity} × {formatCurrency(line.unitPrice)}
              </li>
            ))}
          </ul>
        )}

        {createPurchaseOrder.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createPurchaseOrder.error)}
          </p>
        )}
        <Button type="submit" isLoading={createPurchaseOrder.isPending} disabled={!supplierId || !warehouseId || pending.length === 0}>
          Create Purchase Order
        </Button>
      </form>
    </Modal>
  );
}
