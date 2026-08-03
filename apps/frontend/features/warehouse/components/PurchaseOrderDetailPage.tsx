"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Send, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useAuthStore } from "@/stores/auth.store";
import { useItems, useSuppliers, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useApprovePurchaseOrder, useCancelPurchaseOrder, usePurchaseOrder, useRejectPurchaseOrder, useSubmitPurchaseOrder } from "../hooks/usePurchaseOrder";
import { PO_STATUS_TONE } from "./PurchaseOrderListPage";

export function PurchaseOrderDetailPage({ purchaseOrderId }: { purchaseOrderId: string }) {
  const { data: po, isLoading, isError, error, refetch } = usePurchaseOrder(purchaseOrderId);
  const { data: suppliersData } = useSuppliers();
  const { data: itemsData } = useItems();
  const { data: warehousesData } = useWarehouseLocations();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const submitPo = useSubmitPurchaseOrder(purchaseOrderId);
  const approvePo = useApprovePurchaseOrder(purchaseOrderId);
  const rejectPo = useRejectPurchaseOrder(purchaseOrderId);
  const cancelPo = useCancelPurchaseOrder(purchaseOrderId);
  const [showReject, setShowReject] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  if (isLoading) return <LoadingState label="Loading purchase order..." rows={3} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!po) return null;

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const supplierName = (id: string) => suppliersData?.items.find((s) => s.id === id)?.name ?? id;
  const warehouseName = (id: string) => warehousesData?.items.find((w) => w.id === id)?.name ?? id;

  const isOwnDraft = po.createdBy === currentUserId;
  const mutationError = submitPo.error ?? approvePo.error ?? rejectPo.error ?? cancelPo.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{po.purchaseOrderNumber}</h1>
          <Badge tone={PO_STATUS_TONE[po.status]}>{po.status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="flex gap-2">
          {po.status === "DRAFT" && (
            <PermissionGuard permission="warehouse.purchase.submit">
              <Button isLoading={submitPo.isPending} onClick={() => submitPo.mutate()}>
                <Send size={14} strokeWidth={1.75} aria-hidden="true" />
                Submit
              </Button>
            </PermissionGuard>
          )}
          {po.status === "SUBMITTED" && (
            <PermissionGuard permission="warehouse.purchase.approve">
              <Button
                isLoading={approvePo.isPending}
                onClick={() => approvePo.mutate()}
                disabled={isOwnDraft}
                title={isOwnDraft ? "You created this purchase order — a different approver must approve it" : undefined}
              >
                <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowReject(true)}
                disabled={isOwnDraft}
                title={isOwnDraft ? "You created this purchase order — a different approver must reject it" : undefined}
              >
                <ThumbsDown size={14} strokeWidth={1.75} aria-hidden="true" />
                Reject
              </Button>
            </PermissionGuard>
          )}
          {(po.status === "DRAFT" || po.status === "SUBMITTED") && (
            <PermissionGuard permission="warehouse.purchase.cancel">
              <Button variant="secondary" onClick={() => setShowCancel(true)}>
                <XCircle size={14} strokeWidth={1.75} aria-hidden="true" />
                Cancel
              </Button>
            </PermissionGuard>
          )}
          {po.status === "APPROVED" && (
            <PermissionGuard permission="warehouse.purchase.receive">
              <Link href={`/warehouse/goods-receipts/new?purchaseOrderId=${po.id}`}>
                <Button>Create Goods Receipt</Button>
              </Link>
            </PermissionGuard>
          )}
        </div>
      </div>

      {mutationError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(mutationError)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Supplier</span>
          <p className="text-sm text-foreground">{supplierName(po.supplierId)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Warehouse</span>
          <p className="text-sm text-foreground">{warehouseName(po.warehouseId)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Order Date</span>
          <p className="font-tabular text-sm text-foreground">{new Date(po.orderDate).toLocaleDateString()}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Total</span>
          <p className="font-tabular text-sm font-semibold text-foreground">{formatCurrency(po.totalAmount)}</p>
        </div>
      </div>

      {po.rejectionReason && (
        <p role="status" className="text-sm text-error">
          Rejected: {po.rejectionReason}
        </p>
      )}
      {po.cancelReason && (
        <p role="status" className="text-sm text-muted">
          Cancelled: {po.cancelReason}
        </p>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Line Items</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Item</TableHeaderCell>
              <TableHeaderCell>Qty Ordered</TableHeaderCell>
              <TableHeaderCell>Qty Received</TableHeaderCell>
              <TableHeaderCell>Unit Price</TableHeaderCell>
              <TableHeaderCell>Subtotal</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {po.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{itemName(item.itemId)}</TableCell>
                <TableCell className="font-tabular">{item.quantityOrdered}</TableCell>
                <TableCell className="font-tabular">{item.quantityReceived}</TableCell>
                <TableCell className="font-tabular">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="font-tabular">{formatCurrency(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showReject && (
        <ReasonModal title="Reject Purchase Order" isLoading={rejectPo.isPending} onSubmit={(reason) => rejectPo.mutate(reason as string, { onSuccess: () => setShowReject(false) })} onClose={() => setShowReject(false)} />
      )}
      {showCancel && (
        <ReasonModal title="Cancel Purchase Order" isLoading={cancelPo.isPending} onSubmit={(reason) => cancelPo.mutate(reason, { onSuccess: () => setShowCancel(false) })} onClose={() => setShowCancel(false)} required={false} />
      )}
    </div>
  );
}

function ReasonModal({
  title,
  isLoading,
  required = true,
  onSubmit,
  onClose,
}: {
  title: string;
  isLoading: boolean;
  required?: boolean;
  onSubmit: (reason: string | undefined) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (required && !reason.trim()) return;
    onSubmit(reason.trim() || undefined);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="reasonInput" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required={required} />
        <Button type="submit" isLoading={isLoading} disabled={required && !reason.trim()}>
          Confirm
        </Button>
      </form>
    </Modal>
  );
}
