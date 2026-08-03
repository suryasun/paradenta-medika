"use client";

import { FormEvent, useState } from "react";
import { PackageMinus, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems } from "../hooks/useWarehouseCatalogs";
import { useCreateReservation, useStockLedger, useStocks } from "../hooks/useStock";
import { Stock } from "../types/warehouse.types";

export function StockListPage() {
  const { data, isLoading, isError, error, refetch } = useStocks();
  const { data: itemsData } = useItems();
  const [ledgerStock, setLedgerStock] = useState<Stock | null>(null);
  const [reservingStock, setReservingStock] = useState<Stock | null>(null);

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;

  if (isLoading) return <LoadingState label="Loading stock..." rows={5} columns={6} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const stocks = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Stock</h1>
      {stocks.length === 0 ? (
        <EmptyState title="No stock records yet" description="Stock appears once a Goods Receipt is posted for an item." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Item</TableHeaderCell>
              <TableHeaderCell>Current Qty</TableHeaderCell>
              <TableHeaderCell>Reserved Qty</TableHeaderCell>
              <TableHeaderCell>Available Qty</TableHeaderCell>
              <TableHeaderCell>Minimum Stock</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell>{itemName(stock.itemId)}</TableCell>
                <TableCell className="font-tabular">{stock.currentStock}</TableCell>
                <TableCell className="font-tabular">{stock.reservedStock}</TableCell>
                <TableCell className="font-tabular">{stock.availableStock}</TableCell>
                <TableCell className="font-tabular">{stock.minimumStock ?? "-"}</TableCell>
                <TableCell>
                  <Badge tone={stock.status === "LOW_STOCK" ? "warning" : "success"}>{stock.status === "LOW_STOCK" ? "Low Stock" : "OK"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      onClick={() => setLedgerStock(stock)}
                    >
                      Ledger
                    </button>
                    <PermissionGuard permission="warehouse.stock.reserve">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        onClick={() => setReservingStock(stock)}
                      >
                        <PackageMinus size={13} strokeWidth={1.75} aria-hidden="true" />
                        Reserve
                      </button>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {ledgerStock && <StockLedgerModal stock={ledgerStock} itemName={itemName(ledgerStock.itemId)} onClose={() => setLedgerStock(null)} />}
      {reservingStock && <ReserveStockModal stock={reservingStock} onClose={() => setReservingStock(null)} />}
    </div>
  );
}

function StockLedgerModal({ stock, itemName, onClose }: { stock: Stock; itemName: string; onClose: () => void }) {
  const { data, isLoading, isError, error } = useStockLedger(stock.id);

  return (
    <Modal title={`Ledger — ${itemName}`} onClose={onClose}>
      {isLoading && <LoadingState label="Loading ledger..." rows={4} columns={5} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} />}
      {data && data.items.length === 0 && <EmptyState title="No movements recorded yet" />}
      {data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
              <TableHeaderCell>Qty In</TableHeaderCell>
              <TableHeaderCell>Qty Out</TableHeaderCell>
              <TableHeaderCell>Balance</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{new Date(entry.transactionDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {entry.referenceType} #{entry.referenceId.slice(0, 8)}
                </TableCell>
                <TableCell className="font-tabular">{entry.qtyIn > 0 ? entry.qtyIn : "-"}</TableCell>
                <TableCell className="font-tabular">{entry.qtyOut > 0 ? entry.qtyOut : "-"}</TableCell>
                <TableCell className="font-tabular">{entry.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Modal>
  );
}

function ReserveStockModal({ stock, onClose }: { stock: Stock; onClose: () => void }) {
  const [quantity, setQuantity] = useState("");
  const [referenceType, setReferenceType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const createReservation = useCreateReservation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quantity || !referenceType.trim() || !referenceId.trim()) return;
    createReservation.mutate(
      { warehouseId: stock.warehouseId, itemId: stock.itemId, quantity: Number(quantity), referenceType, referenceId },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="Reserve Stock" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          id="reserveQuantity"
          label="Quantity"
          type="number"
          min={0.01}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <Input
          id="reserveReferenceType"
          label="Reference Type"
          placeholder="e.g. TREATMENT_PLAN"
          value={referenceType}
          onChange={(e) => setReferenceType(e.target.value)}
          required
        />
        <Input id="reserveReferenceId" label="Reference Id" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} required />
        {createReservation.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createReservation.error)}
          </p>
        )}
        <Button type="submit" isLoading={createReservation.isPending} disabled={!quantity || !referenceType.trim() || !referenceId.trim()}>
          <PackagePlus size={14} strokeWidth={1.75} aria-hidden="true" />
          Reserve
        </Button>
      </form>
    </Modal>
  );
}
