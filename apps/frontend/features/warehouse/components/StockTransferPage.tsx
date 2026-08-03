"use client";

import { FormEvent, useState } from "react";
import { Package, Plus, Send, ThumbsUp, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Stepper } from "@/components/ui/Stepper";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import {
  useApproveStockTransfer,
  useCreateStockTransfer,
  useDispatchStockTransfer,
  useReceiveStockTransfer,
  useSubmitStockTransfer,
} from "../hooks/useStockTransfer";
import { StockTransfer, StockTransferItemEntry } from "../types/warehouse.types";

const STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "APPROVED", label: "Approved" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "RECEIVED", label: "Received" },
];

// warehouse.routes.ts has no GET /warehouse/transfers list/detail route
// (confirmed, not overlooked) -- this page holds the just-created transfer
// in local state and drives its lifecycle actions from that state, the
// same fallback pattern used for Doctor Fee Settlement's Generate flow.
export function StockTransferPage() {
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-foreground">Stock Transfer</h1>
      <p className="text-sm text-muted">
        No transfer list exists yet on the backend — create a transfer below and its lifecycle actions stay available on this page until you navigate
        away.
      </p>
      {!transfer ? <CreateStockTransferForm onCreated={setTransfer} /> : <TransferLifecycle transfer={transfer} onUpdate={setTransfer} />}
    </div>
  );
}

function CreateStockTransferForm({ onCreated }: { onCreated: (transfer: StockTransfer) => void }) {
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
      { onSuccess: (transfer) => onCreated(transfer) },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap gap-3">
        <Select id="transferSource" label="Source Warehouse" value={sourceWarehouseId} onChange={(e) => setSourceWarehouseId(e.target.value)} required>
          <option value="">Select source</option>
          {warehousesData?.items.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Select id="transferDestination" label="Destination Warehouse" value={destinationWarehouseId} onChange={(e) => setDestinationWarehouseId(e.target.value)} required>
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
      <Button type="submit" isLoading={createTransfer.isPending} disabled={!sourceWarehouseId || !destinationWarehouseId || sameWarehouse || pending.length === 0} className="self-start">
        <Package size={14} strokeWidth={1.75} aria-hidden="true" />
        Create Transfer
      </Button>
    </form>
  );
}

function TransferLifecycle({ transfer, onUpdate }: { transfer: StockTransfer; onUpdate: (transfer: StockTransfer) => void }) {
  const { data: itemsData } = useItems();
  const submitTransfer = useSubmitStockTransfer();
  const approveTransfer = useApproveStockTransfer();
  const dispatchTransfer = useDispatchStockTransfer();
  const receiveTransfer = useReceiveStockTransfer();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const mutationError = submitTransfer.error ?? approveTransfer.error ?? dispatchTransfer.error ?? receiveTransfer.error;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{transfer.transferNumber}</h2>
        <Stepper steps={STEPS} currentKey={transfer.status} />
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
          {transfer.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{itemName(item.itemId)}</TableCell>
              <TableCell className="font-tabular">{item.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2">
        {transfer.status === "DRAFT" && (
          <Button isLoading={submitTransfer.isPending} onClick={() => submitTransfer.mutate(transfer.id, { onSuccess: onUpdate })}>
            <Send size={14} strokeWidth={1.75} aria-hidden="true" />
            Submit
          </Button>
        )}
        {transfer.status === "SUBMITTED" && (
          <Button isLoading={approveTransfer.isPending} onClick={() => approveTransfer.mutate(transfer.id, { onSuccess: onUpdate })}>
            <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
            Approve
          </Button>
        )}
        {transfer.status === "APPROVED" && (
          <Button isLoading={dispatchTransfer.isPending} onClick={() => dispatchTransfer.mutate(transfer.id, { onSuccess: onUpdate })}>
            <Truck size={14} strokeWidth={1.75} aria-hidden="true" />
            Dispatch
          </Button>
        )}
        {transfer.status === "DISPATCHED" && (
          <Button isLoading={receiveTransfer.isPending} onClick={() => receiveTransfer.mutate(transfer.id, { onSuccess: onUpdate })}>
            <Package size={14} strokeWidth={1.75} aria-hidden="true" />
            Receive
          </Button>
        )}
        {transfer.status === "RECEIVED" && <p className="text-sm text-success">Transfer complete — stock updated at the destination.</p>}
      </div>
    </div>
  );
}
