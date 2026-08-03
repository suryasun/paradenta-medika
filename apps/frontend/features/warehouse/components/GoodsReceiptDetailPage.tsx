"use client";

import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useItems } from "../hooks/useWarehouseCatalogs";
import { useGoodsReceipt, usePostGoodsReceipt } from "../hooks/useGoodsReceipt";

export function GoodsReceiptDetailPage({ goodsReceiptId }: { goodsReceiptId: string }) {
  const { data: gr, isLoading, isError, error, refetch } = useGoodsReceipt(goodsReceiptId);
  const { data: itemsData } = useItems();
  const postReceipt = usePostGoodsReceipt(goodsReceiptId);

  if (isLoading) return <LoadingState label="Loading goods receipt..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!gr) return null;

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{gr.goodsReceiptNumber}</h1>
          <Badge tone={gr.status === "POSTED" ? "success" : "neutral"}>{gr.status === "POSTED" ? "Posted — stock updated" : "Draft — not yet posted"}</Badge>
        </div>
        {gr.status === "DRAFT" && (
          <PermissionGuard permission="warehouse.purchase.post">
            <Button isLoading={postReceipt.isPending} onClick={() => postReceipt.mutate()}>
              <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
              Post Receipt
            </Button>
          </PermissionGuard>
        )}
      </div>

      {postReceipt.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(postReceipt.error)}
        </p>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell>Qty</TableHeaderCell>
            <TableHeaderCell>Unit Cost</TableHeaderCell>
            <TableHeaderCell>Batch No.</TableHeaderCell>
            <TableHeaderCell>Expiry Date</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {gr.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{itemName(item.itemId)}</TableCell>
              <TableCell className="font-tabular">{item.quantity}</TableCell>
              <TableCell className="font-tabular">{formatCurrency(item.unitCost)}</TableCell>
              <TableCell>{item.batchNumber ?? "-"}</TableCell>
              <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
