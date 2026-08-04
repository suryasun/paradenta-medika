"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ThumbsUp } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems } from "../hooks/useWarehouseCatalogs";
import { useApproveStockAdjustment, usePostStockAdjustment, useStockAdjustment } from "../hooks/useStockAdjustment";
import { ADJUSTMENT_STATUS_TONE } from "./StockAdjustmentListPage";

export function StockAdjustmentDetailPage({ adjustmentId }: { adjustmentId: string }) {
  const { data: adjustment, isLoading, isError, error, refetch } = useStockAdjustment(adjustmentId);
  const { data: itemsData } = useItems();
  const approveAdjustment = useApproveStockAdjustment(adjustmentId);
  const postAdjustment = usePostStockAdjustment(adjustmentId);

  if (isLoading) return <LoadingState label="Loading stock adjustment..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!adjustment) return null;

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const mutationError = approveAdjustment.error ?? postAdjustment.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">
          {adjustment.adjustmentNumber}{" "}
          <span className="text-sm font-normal text-muted">
            ({adjustment.direction}, {adjustment.reasonCode})
          </span>
        </h1>
        <Badge tone={ADJUSTMENT_STATUS_TONE[adjustment.status]}>{adjustment.status}</Badge>
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
          <PermissionGuard permission="warehouse.stock.adjust">
            <Button isLoading={approveAdjustment.isPending} onClick={() => approveAdjustment.mutate()}>
              <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
              Approve
            </Button>
          </PermissionGuard>
        )}
        {adjustment.status === "APPROVED" && (
          <PermissionGuard permission="warehouse.stock.adjust.post">
            <Button isLoading={postAdjustment.isPending} onClick={() => postAdjustment.mutate()}>
              <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
              Post
            </Button>
          </PermissionGuard>
        )}
        {adjustment.status === "POSTED" && <p className="text-sm text-success">Adjustment posted — stock updated.</p>}
      </div>
    </div>
  );
}
