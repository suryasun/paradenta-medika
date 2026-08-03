"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import { useCreateGoodsReceipt } from "../hooks/useGoodsReceipt";
import { usePurchaseOrder } from "../hooks/usePurchaseOrder";
import { GoodsReceiptItemEntry } from "../types/warehouse.types";

export function GoodsReceiptCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseOrderId = searchParams.get("purchaseOrderId") ?? "";
  const { data: po, isLoading, isError, error } = usePurchaseOrder(purchaseOrderId);
  const { data: itemsData } = useItems();
  const { data: warehousesData } = useWarehouseLocations();
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierDocumentNo, setSupplierDocumentNo] = useState("");
  const [lines, setLines] = useState<Record<string, { quantity: string; unitCost: string; batchNumber: string; expiryDate: string }>>({});
  const createGoodsReceipt = useCreateGoodsReceipt();

  if (!purchaseOrderId) return <ErrorState message="No purchase order selected. Open a Goods Receipt from an approved Purchase Order's detail page." />;
  if (isLoading) return <LoadingState label="Loading purchase order..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!po) return null;

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const remaining = (item: (typeof po.items)[number]) => item.quantityOrdered - item.quantityReceived;

  function lineFor(itemId: string, poItemId: string, defaultQty: number) {
    return lines[poItemId] ?? { quantity: String(defaultQty), unitCost: "", batchNumber: "", expiryDate: "" };
  }

  function updateLine(poItemId: string, patch: Partial<{ quantity: string; unitCost: string; batchNumber: string; expiryDate: string }>) {
    setLines((prev) => ({ ...prev, [poItemId]: { ...lineFor("", poItemId, 0), ...prev[poItemId], ...patch } }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!po || !warehousesData) return;
    const items: GoodsReceiptItemEntry[] = [];
    for (const poItem of po.items) {
      const line = lines[poItem.id];
      const quantity = Number(line?.quantity ?? 0);
      if (!line || quantity <= 0) continue;
      items.push({
        purchaseOrderItemId: poItem.id,
        itemId: poItem.itemId,
        quantity,
        unitCost: Number(line.unitCost || poItem.unitPrice),
        batchNumber: line.batchNumber || undefined,
        expiryDate: line.expiryDate || undefined,
      });
    }
    if (items.length === 0) return;
    createGoodsReceipt.mutate(
      { purchaseOrderId: po.id, warehouseId: po.warehouseId, receiptDate, supplierDocumentNo: supplierDocumentNo || undefined, items },
      { onSuccess: (goodsReceipt) => router.push(`/warehouse/goods-receipts/${goodsReceipt.id}`) },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Goods Receipt — {po.purchaseOrderNumber}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <Input id="receiptDate" label="Receipt Date" type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} required />
          <Input
            id="supplierDocumentNo"
            label="Supplier Document No. (optional)"
            value={supplierDocumentNo}
            onChange={(e) => setSupplierDocumentNo(e.target.value)}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Item</TableHeaderCell>
              <TableHeaderCell>Ordered / Received</TableHeaderCell>
              <TableHeaderCell>Receive Qty</TableHeaderCell>
              <TableHeaderCell>Unit Cost</TableHeaderCell>
              <TableHeaderCell>Batch No.</TableHeaderCell>
              <TableHeaderCell>Expiry Date</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {po.items.map((poItem) => {
              const remainingQty = remaining(poItem);
              const line = lineFor(poItem.itemId, poItem.id, remainingQty);
              return (
                <TableRow key={poItem.id}>
                  <TableCell>{itemName(poItem.itemId)}</TableCell>
                  <TableCell className="font-tabular">
                    {poItem.quantityOrdered} / {poItem.quantityReceived}
                  </TableCell>
                  <TableCell>
                    <Input
                      id={`qty-${poItem.id}`}
                      type="number"
                      min={0}
                      max={remainingQty}
                      value={line.quantity}
                      onChange={(e) => updateLine(poItem.id, { quantity: e.target.value })}
                      className="w-24"
                    />
                    {Number(line.quantity) > remainingQty && <p className="text-xs text-error">Exceeds remaining ordered quantity ({remainingQty})</p>}
                  </TableCell>
                  <TableCell>
                    <Input
                      id={`cost-${poItem.id}`}
                      type="number"
                      min={0}
                      placeholder={String(poItem.unitPrice)}
                      value={line.unitCost}
                      onChange={(e) => updateLine(poItem.id, { unitCost: e.target.value })}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Input id={`batch-${poItem.id}`} value={line.batchNumber} onChange={(e) => updateLine(poItem.id, { batchNumber: e.target.value })} className="w-32" />
                  </TableCell>
                  <TableCell>
                    <Input
                      id={`expiry-${poItem.id}`}
                      type="date"
                      value={line.expiryDate}
                      onChange={(e) => updateLine(poItem.id, { expiryDate: e.target.value })}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {createGoodsReceipt.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createGoodsReceipt.error)}
          </p>
        )}
        <Button type="submit" isLoading={createGoodsReceipt.isPending} className="self-start">
          Create Goods Receipt
        </Button>
      </form>
    </div>
  );
}
