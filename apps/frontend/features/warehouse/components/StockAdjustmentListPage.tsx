"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClipboardEdit } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useStocks } from "../hooks/useStock";
import { useCreateStockAdjustment, useStockAdjustments } from "../hooks/useStockAdjustment";
import { StockAdjustmentDirection, StockAdjustmentItemEntry, StockAdjustmentStatus } from "../types/warehouse.types";

const REASON_CODES = ["damaged", "lost", "expired", "sample"];

export const ADJUSTMENT_STATUS_TONE: Record<StockAdjustmentStatus, "neutral" | "info" | "success"> = {
  DRAFT: "neutral",
  APPROVED: "info",
  POSTED: "success",
};

export function StockAdjustmentListPage() {
  const { data, isLoading, isError, error, refetch } = useStockAdjustments();
  const { data: warehousesData } = useWarehouseLocations();
  const [showCreate, setShowCreate] = useState(false);

  const warehouseName = (id: string) => warehousesData?.items.find((w) => w.id === id)?.name ?? id;

  const createAction = (
    <PermissionGuard permission="warehouse.stock.adjust">
      <Button onClick={() => setShowCreate(true)}>
        <ClipboardEdit size={14} strokeWidth={1.75} aria-hidden="true" />
        New Adjustment
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading stock adjustments..." rows={4} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const adjustments = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Stock Adjustments</h1>
        {createAction}
      </div>

      {adjustments.length === 0 ? (
        <EmptyState title="No stock adjustments yet" description="Create the first adjustment." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Adjustment No.</TableHeaderCell>
              <TableHeaderCell>Warehouse</TableHeaderCell>
              <TableHeaderCell>Direction</TableHeaderCell>
              <TableHeaderCell>Reason</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustments.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>{adjustment.adjustmentNumber}</TableCell>
                <TableCell>{warehouseName(adjustment.warehouseId)}</TableCell>
                <TableCell>{adjustment.direction}</TableCell>
                <TableCell>{adjustment.reasonCode}</TableCell>
                <TableCell>
                  <Badge tone={ADJUSTMENT_STATUS_TONE[adjustment.status]}>{adjustment.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/warehouse/adjustments/${adjustment.id}`} className="text-sm font-medium text-primary hover:underline">
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateStockAdjustmentModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateStockAdjustmentModal({ onClose }: { onClose: () => void }) {
  const { data: warehousesData } = useWarehouseLocations();
  const { data: itemsData } = useItems();
  const [warehouseId, setWarehouseId] = useState("");
  const [direction, setDirection] = useState<StockAdjustmentDirection>("OUT");
  const [reasonCode, setReasonCode] = useState(REASON_CODES[0]);
  const { data: stocksData } = useStocks();
  const [pending, setPending] = useState<StockAdjustmentItemEntry[]>([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const createAdjustment = useCreateStockAdjustment();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const currentStockFor = (id: string) => stocksData?.items.find((s) => s.itemId === id && s.warehouseId === warehouseId)?.currentStock;

  function addPending() {
    if (!itemId || !quantity) return;
    setPending((prev) => [...prev, { itemId, quantity: Number(quantity) }]);
    setItemId("");
    setQuantity("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!warehouseId || !reasonCode || pending.length === 0) return;
    createAdjustment.mutate({ warehouseId, direction, reasonCode, items: pending }, { onSuccess: () => onClose() });
  }

  const currentStock = itemId ? currentStockFor(itemId) : undefined;
  const wouldGoNegative = direction === "OUT" && currentStock != null && quantity !== "" && currentStock - Number(quantity) < 0;

  return (
    <Modal title="New Stock Adjustment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <Select id="adjustmentWarehouse" label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            <option value="">Select a warehouse</option>
            {warehousesData?.items.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          <Select id="adjustmentDirection" label="Direction" value={direction} onChange={(e) => setDirection(e.target.value as StockAdjustmentDirection)}>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </Select>
          <Select id="adjustmentReason" label="Reason" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} required>
            {REASON_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-3">
          <Select id="adjustmentItem" label="Item" value={itemId} onChange={(e) => setItemId(e.target.value)} className="min-w-40">
            <option value="">Select an item</option>
            {itemsData?.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
          <Input id="adjustmentQuantity" label="Qty" type="number" min={0.01} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
          <Button type="button" variant="secondary" onClick={addPending} disabled={!itemId || !quantity}>
            Add Line
          </Button>
        </div>
        {itemId && currentStock != null && <p className="text-xs text-muted">Current stock: {currentStock}</p>}
        {wouldGoNegative && <p className="text-xs text-error">This quantity would drive stock negative — not allowed.</p>}

        {pending.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {pending.map((line, index) => (
              <li key={index}>
                {itemName(line.itemId)} — {line.quantity}
              </li>
            ))}
          </ul>
        )}

        {createAdjustment.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createAdjustment.error)}
          </p>
        )}
        <Button type="submit" isLoading={createAdjustment.isPending} disabled={!warehouseId || pending.length === 0}>
          <ClipboardEdit size={14} strokeWidth={1.75} aria-hidden="true" />
          Create Adjustment
        </Button>
      </form>
    </Modal>
  );
}
