"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Package, Plus } from "lucide-react";
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
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useCreateStockTransfer, useStockTransfers } from "../hooks/useStockTransfer";
import { StockTransferItemEntry, StockTransferStatus } from "../types/warehouse.types";

export const TRANSFER_STATUS_TONE: Record<StockTransferStatus, "neutral" | "warning" | "info" | "success"> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED: "info",
  DISPATCHED: "info",
  RECEIVED: "success",
};

export function StockTransferListPage() {
  const { data, isLoading, isError, error, refetch } = useStockTransfers();
  const { data: warehousesData } = useWarehouseLocations();
  const [showCreate, setShowCreate] = useState(false);

  const warehouseName = (id: string) => warehousesData?.items.find((w) => w.id === id)?.name ?? id;

  const createAction = (
    <PermissionGuard permission="warehouse.stock.transfer">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Transfer
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading stock transfers..." rows={4} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const transfers = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Stock Transfers</h1>
        {createAction}
      </div>

      {transfers.length === 0 ? (
        <EmptyState title="No stock transfers yet" description="Create the first transfer between warehouses." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Transfer No.</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell>Destination</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{transfer.transferNumber}</TableCell>
                <TableCell>{warehouseName(transfer.sourceWarehouseId)}</TableCell>
                <TableCell>{warehouseName(transfer.destinationWarehouseId)}</TableCell>
                <TableCell>
                  <Badge tone={TRANSFER_STATUS_TONE[transfer.status]}>{transfer.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/warehouse/transfers/${transfer.id}`} className="text-sm font-medium text-primary hover:underline">
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateStockTransferModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateStockTransferModal({ onClose }: { onClose: () => void }) {
  const { data: warehousesData } = useWarehouseLocations();
  const { data: itemsData } = useItems();
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<StockTransferItemEntry[]>([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const createTransfer = useCreateStockTransfer();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const sameWarehouse = !!sourceWarehouseId && sourceWarehouseId === destinationWarehouseId;

  function addPending() {
    if (!itemId || !quantity) return;
    setPending((prev) => [...prev, { itemId, quantity: Number(quantity) }]);
    setItemId("");
    setQuantity("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId || sameWarehouse || pending.length === 0) return;
    createTransfer.mutate(
      { sourceWarehouseId, destinationWarehouseId, notes: notes || undefined, items: pending },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="New Stock Transfer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <Select id="transferSource" label="Source Warehouse" value={sourceWarehouseId} onChange={(e) => setSourceWarehouseId(e.target.value)} required>
            <option value="">Select source</option>
            {warehousesData?.items.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          <Select
            id="transferDestination"
            label="Destination Warehouse"
            value={destinationWarehouseId}
            onChange={(e) => setDestinationWarehouseId(e.target.value)}
            required
          >
            <option value="">Select destination</option>
            {warehousesData?.items.map((w) => (
              <option key={w.id} value={w.id} disabled={w.id === sourceWarehouseId}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>
        {sameWarehouse && <p className="text-xs text-error">Source and destination must be different warehouses.</p>}
        <Input id="transferNotes" label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-3">
          <Select id="transferItem" label="Item" value={itemId} onChange={(e) => setItemId(e.target.value)} className="min-w-40">
            <option value="">Select an item</option>
            {itemsData?.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
          <Input id="transferQuantity" label="Qty" type="number" min={0.01} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
          <Button type="button" variant="secondary" onClick={addPending} disabled={!itemId || !quantity}>
            <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
            Add Line
          </Button>
        </div>

        {pending.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {pending.map((line, index) => (
              <li key={index}>
                {itemName(line.itemId)} — {line.quantity}
              </li>
            ))}
          </ul>
        )}

        {createTransfer.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createTransfer.error)}
          </p>
        )}
        <Button
          type="submit"
          isLoading={createTransfer.isPending}
          disabled={!sourceWarehouseId || !destinationWarehouseId || sameWarehouse || pending.length === 0}
        >
          <Package size={14} strokeWidth={1.75} aria-hidden="true" />
          Create Transfer
        </Button>
      </form>
    </Modal>
  );
}
