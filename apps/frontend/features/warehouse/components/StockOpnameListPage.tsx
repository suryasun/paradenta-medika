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
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useCreateStockOpname, useStockOpnames } from "../hooks/useStockOpname";
import { StockOpnameStatus } from "../types/warehouse.types";

const STATUS_TONE: Record<StockOpnameStatus, "neutral" | "warning" | "info" | "success" | "error"> = {
  DRAFT: "neutral",
  COUNTING: "warning",
  SUBMITTED: "info",
  APPROVED: "info",
  POSTED: "success",
  REJECTED: "error",
};

export function StockOpnameListPage() {
  const { data, isLoading, isError, error, refetch } = useStockOpnames();
  const { data: warehousesData } = useWarehouseLocations();
  const [showCreate, setShowCreate] = useState(false);

  const warehouseName = (id: string) => warehousesData?.items.find((w) => w.id === id)?.name ?? id;

  const createAction = (
    <PermissionGuard permission="warehouse.opname.create">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Stock Opname
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading stock opnames..." rows={4} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const opnames = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Stock Opname</h1>
        {createAction}
      </div>

      {opnames.length === 0 ? (
        <EmptyState title="No stock opnames yet" description="Start a physical count for a warehouse." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Opname No.</TableHeaderCell>
              <TableHeaderCell>Warehouse</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {opnames.map((opname) => (
              <TableRow key={opname.id}>
                <TableCell>{opname.opnameNumber}</TableCell>
                <TableCell>{warehouseName(opname.warehouseId)}</TableCell>
                <TableCell>{new Date(opname.opnameDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[opname.status]}>{opname.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/warehouse/stock-opnames/${opname.id}`} className="text-sm font-medium text-primary hover:underline">
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateStockOpnameModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateStockOpnameModal({ onClose }: { onClose: () => void }) {
  const { data: warehousesData } = useWarehouseLocations();
  const { data: itemsData } = useItems();
  const [warehouseId, setWarehouseId] = useState("");
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const createOpname = useCreateStockOpname();

  function toggleItem(id: string) {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!warehouseId || selectedItemIds.length === 0) return;
    createOpname.mutate({ warehouseId, opnameDate, notes: notes || undefined, items: selectedItemIds }, { onSuccess: () => onClose() });
  }

  return (
    <Modal title="New Stock Opname" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="opnameWarehouse" label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
          <option value="">Select a warehouse</option>
          {warehousesData?.items.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Input id="opnameDate" label="Opname Date" type="date" value={opnameDate} onChange={(e) => setOpnameDate(e.target.value)} required />
        <Input id="opnameNotes" label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <fieldset className="flex flex-col gap-1 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium text-foreground">Items to count</legend>
          <div className="max-h-48 overflow-y-auto">
            {itemsData?.items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 py-1 text-sm text-foreground">
                <input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => toggleItem(item.id)} />
                {item.name}
              </label>
            ))}
          </div>
        </fieldset>

        {createOpname.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createOpname.error)}
          </p>
        )}
        <Button type="submit" isLoading={createOpname.isPending} disabled={!warehouseId || selectedItemIds.length === 0}>
          Create Stock Opname
        </Button>
      </form>
    </Modal>
  );
}
