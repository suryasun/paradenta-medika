"use client";

import { Package, Send, ThumbsUp, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Stepper } from "@/components/ui/Stepper";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import {
  useApproveStockTransfer,
  useDispatchStockTransfer,
  useReceiveStockTransfer,
  useStockTransfer,
  useSubmitStockTransfer,
} from "../hooks/useStockTransfer";

const STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "APPROVED", label: "Approved" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "RECEIVED", label: "Received" },
];

export function StockTransferDetailPage({ transferId }: { transferId: string }) {
  const { data: transfer, isLoading, isError, error, refetch } = useStockTransfer(transferId);
  const { data: itemsData } = useItems();
  const { data: warehousesData } = useWarehouseLocations();
  const submitTransfer = useSubmitStockTransfer(transferId);
  const approveTransfer = useApproveStockTransfer(transferId);
  const dispatchTransfer = useDispatchStockTransfer(transferId);
  const receiveTransfer = useReceiveStockTransfer(transferId);

  if (isLoading) return <LoadingState label="Loading stock transfer..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!transfer) return null;

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const warehouseName = (id: string) => warehousesData?.items.find((w) => w.id === id)?.name ?? id;
  const mutationError = submitTransfer.error ?? approveTransfer.error ?? dispatchTransfer.error ?? receiveTransfer.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">{transfer.transferNumber}</h1>
        <Stepper steps={STEPS} currentKey={transfer.status} />
      </div>

      {mutationError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(mutationError)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Source</span>
          <p className="text-sm text-foreground">{warehouseName(transfer.sourceWarehouseId)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Destination</span>
          <p className="text-sm text-foreground">{warehouseName(transfer.destinationWarehouseId)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Notes</span>
          <p className="text-sm text-foreground">{transfer.notes ?? "-"}</p>
        </div>
      </div>

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
          <PermissionGuard permission="warehouse.stock.transfer">
            <Button isLoading={submitTransfer.isPending} onClick={() => submitTransfer.mutate()}>
              <Send size={14} strokeWidth={1.75} aria-hidden="true" />
              Submit
            </Button>
          </PermissionGuard>
        )}
        {transfer.status === "SUBMITTED" && (
          <PermissionGuard permission="warehouse.stock.transfer">
            <Button isLoading={approveTransfer.isPending} onClick={() => approveTransfer.mutate()}>
              <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
              Approve
            </Button>
          </PermissionGuard>
        )}
        {transfer.status === "APPROVED" && (
          <PermissionGuard permission="warehouse.stock.transfer">
            <Button isLoading={dispatchTransfer.isPending} onClick={() => dispatchTransfer.mutate()}>
              <Truck size={14} strokeWidth={1.75} aria-hidden="true" />
              Dispatch
            </Button>
          </PermissionGuard>
        )}
        {transfer.status === "DISPATCHED" && (
          <PermissionGuard permission="warehouse.stock.transfer">
            <Button isLoading={receiveTransfer.isPending} onClick={() => receiveTransfer.mutate()}>
              <Package size={14} strokeWidth={1.75} aria-hidden="true" />
              Receive
            </Button>
          </PermissionGuard>
        )}
        {transfer.status === "RECEIVED" && <p className="text-sm text-success">Transfer complete — stock updated at the destination.</p>}
      </div>
    </div>
  );
}
