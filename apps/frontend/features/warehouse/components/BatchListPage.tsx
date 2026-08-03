"use client";

import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useBatches, useQuarantineBatch } from "../hooks/useBatches";
import { ItemBatchStatus } from "../types/warehouse.types";

const STATUS_TONE: Record<ItemBatchStatus, "success" | "warning" | "error" | "neutral"> = {
  ACTIVE: "success",
  QUARANTINED: "warning",
  EXPIRED: "error",
  DEPLETED: "neutral",
};

export function BatchListPage() {
  const { data, isLoading, isError, error, refetch } = useBatches();
  const { data: itemsData } = useItems();
  const { data: warehousesData } = useWarehouseLocations();
  const quarantineBatch = useQuarantineBatch();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const warehouseName = (id: string) => warehousesData?.items.find((w) => w.id === id)?.name ?? id;

  if (isLoading) return <LoadingState label="Loading batches..." rows={5} columns={6} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const batches = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Batches</h1>
      {batches.length === 0 ? (
        <EmptyState title="No batches recorded yet" description="Batches appear once a batch-tracked Goods Receipt is posted." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Item</TableHeaderCell>
              <TableHeaderCell>Batch No.</TableHeaderCell>
              <TableHeaderCell>Warehouse</TableHeaderCell>
              <TableHeaderCell>Expiry Date</TableHeaderCell>
              <TableHeaderCell>Remaining Qty</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>{itemName(batch.itemId)}</TableCell>
                <TableCell>{batch.batchNumber}</TableCell>
                <TableCell>{warehouseName(batch.warehouseId)}</TableCell>
                <TableCell>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "-"}</TableCell>
                <TableCell className="font-tabular">{batch.remainingQuantity}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[batch.status]}>{batch.status}</Badge>
                </TableCell>
                <TableCell>
                  {batch.status === "ACTIVE" && (
                    <PermissionGuard permission="warehouse.batch.quarantine">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-error hover:underline"
                        onClick={() => quarantineBatch.mutate(batch.id)}
                      >
                        <ShieldAlert size={13} strokeWidth={1.75} aria-hidden="true" />
                        Quarantine
                      </button>
                    </PermissionGuard>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
