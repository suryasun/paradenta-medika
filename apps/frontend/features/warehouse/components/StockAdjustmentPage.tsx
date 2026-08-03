"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, ClipboardEdit, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useStocks } from "../hooks/useStock";
import { useApproveStockAdjustment, useCreateStockAdjustment, usePostStockAdjustment } from "../hooks/useStockAdjustment";
import { StockAdjustment, StockAdjustmentDirection, StockAdjustmentItemEntry } from "../types/warehouse.types";

const REASON_CODES = ["damaged", "lost", "expired", "sample"];

// Same no-list-route fallback as Stock Transfer (warehouse.routes.ts has
// no GET /warehouse/adjustments) -- holds the created adjustment in local
// state and drives Approve/Post from it.
export function StockAdjustmentPage() {
  const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-foreground">Stock Adjustment</h1>
      <p className="text-sm text-muted">
        No adjustment list exists yet on the backend — create an adjustment below and its Approve/Post actions stay available on this page until you
        navigate away.
      </p>
      {!adjustment ? <CreateStockAdjustmentForm onCreated={setAdjustment} /> : <AdjustmentLifecycle adjustment={adjustment} onUpdate={setAdjustment} />}
    </div>
  );
}

function CreateStockAdjustmentForm({ onCreated }: { onCreated: (adjustment: StockAdjustment) => void }) {
  const { data: warehousesData } = useWarehouseLocations();
  const { data: itemsData } = useItems();
  const { data: stocksData } = useStocks();
  const [warehouseId, setWarehouseId] = useState("");
  const [direction, setDirection] = useState<StockAdjustmentDirection>("OUT");
  const [reasonCode, setReasonCode] = useState(REASON_CODES[0]);
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
    createAdjustment.mutate({ warehouseId, direction, reasonCode, items: pending }, { onSuccess: (adjustment) => onCreated(adjustment) });
  }

  const currentStock = itemId ? currentStockFor(itemId) : undefined;
  const wouldGoNegative = direction === "OUT" && currentStock != null && quantity !== "" && currentStock - Number(quantity) < 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-4">
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
      <Button type="submit" isLoading={createAdjustment.isPending} disabled={!warehouseId || pending.length === 0} className="self-start">
        <ClipboardEdit size={14} strokeWidth={1.75} aria-hidden="true" />
        Create Adjustment
      </Button>
    </form>
  );
}

function AdjustmentLifecycle({ adjustment, onUpdate }: { adjustment: StockAdjustment; onUpdate: (adjustment: StockAdjustment) => void }) {
  const { data: itemsData } = useItems();
  const approveAdjustment = useApproveStockAdjustment();
  const postAdjustment = usePostStockAdjustment();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const mutationError = approveAdjustment.error ?? postAdjustment.error;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">
          {adjustment.adjustmentNumber} <span className="text-sm font-normal text-muted">({adjustment.direction}, {adjustment.reasonCode})</span>
        </h2>
        <Badge tone={adjustment.status === "POSTED" ? "success" : adjustment.status === "APPROVED" ? "info" : "neutral"}>{adjustment.status}</Badge>
      </div>

      {mutationError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(mutationError)}
        </p>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell>Quantity</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {adjustment.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{itemName(item.itemId)}</TableCell>
              <TableCell className="font-tabular">{item.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2">
        {adjustment.status === "DRAFT" && (
          <Button isLoading={approveAdjustment.isPending} onClick={() => approveAdjustment.mutate(adjustment.id, { onSuccess: onUpdate })}>
            <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
            Approve
          </Button>
        )}
        {adjustment.status === "APPROVED" && (
          <Button isLoading={postAdjustment.isPending} onClick={() => postAdjustment.mutate(adjustment.id, { onSuccess: onUpdate })}>
            <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Post
          </Button>
        )}
        {adjustment.status === "POSTED" && <p className="text-sm text-success">Adjustment posted — stock updated.</p>}
      </div>
    </div>
  );
}
