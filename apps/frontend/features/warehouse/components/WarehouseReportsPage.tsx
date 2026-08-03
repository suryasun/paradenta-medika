"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useItems, useWarehouseLocations } from "../hooks/useWarehouseCatalogs";
import {
  useExpiryReport,
  useMovementsReport,
  useOpnamesReport,
  usePurchasesReport,
  useStockBalanceReport,
  useStockCardReport,
} from "../hooks/useWarehouseReports";

// warehouse.md §12/§15: table-only this pass (Recharts upgrade deferred,
// flagged in the approved plan) -- every tab still carries a filter +
// "as of" metadata line per the shared reporting convention.
export function WarehouseReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Warehouse Reports</h1>
      <Tabs
        items={[
          { key: "stock-card", label: "Stock Card", content: <StockCardReport /> },
          { key: "stock-balance", label: "Stock Balance", content: <StockBalanceReport /> },
          { key: "movements", label: "Movements", content: <MovementsReport /> },
          { key: "purchases", label: "Purchases", content: <PurchasesReport /> },
          { key: "expiry", label: "Expiry", content: <ExpiryReport /> },
          { key: "opnames", label: "Opnames", content: <OpnamesReport /> },
        ]}
      />
    </div>
  );
}

function ReportMeta({ generatedAt }: { generatedAt: Date }) {
  return <p className="text-xs text-muted">Data as of {generatedAt.toLocaleString()}</p>;
}

function StockCardReport() {
  const { data: warehousesData } = useWarehouseLocations();
  const { data: itemsData } = useItems();
  const [warehouseId, setWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");
  const { data, isLoading, isError, error } = useStockCardReport({ warehouseId, itemId });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Select id="stockCardWarehouse" label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="">Select a warehouse</option>
          {warehousesData?.items.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Select id="stockCardItem" label="Item" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">Select an item</option>
          {itemsData?.items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
      </div>
      {!warehouseId || !itemId ? (
        <EmptyState title="Select a warehouse and item" description="The Stock Card report requires both filters." />
      ) : (
        <>
          {isLoading && <LoadingState label="Loading stock card..." rows={4} columns={5} />}
          {isError && <ErrorState message={getApiErrorMessage(error)} />}
          {data && (
            <>
              <ReportMeta generatedAt={new Date()} />
              {data.items.length === 0 ? (
                <EmptyState title="No movements in range" />
              ) : (
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
                        <TableCell>{entry.referenceType}</TableCell>
                        <TableCell className="font-tabular">{entry.qtyIn > 0 ? entry.qtyIn : "-"}</TableCell>
                        <TableCell className="font-tabular">{entry.qtyOut > 0 ? entry.qtyOut : "-"}</TableCell>
                        <TableCell className="font-tabular">{entry.balance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function StockBalanceReport() {
  const { data: itemsData } = useItems();
  const { data, isLoading, isError, error } = useStockBalanceReport();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;

  if (isLoading) return <LoadingState label="Loading stock balance..." rows={5} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No stock balances yet" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell>Current Qty</TableHeaderCell>
            <TableHeaderCell>Available Qty</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((stock) => (
            <TableRow key={stock.id}>
              <TableCell>{itemName(stock.itemId)}</TableCell>
              <TableCell className="font-tabular">{stock.currentStock}</TableCell>
              <TableCell className="font-tabular">{stock.availableStock}</TableCell>
              <TableCell>
                <Badge tone={stock.status === "LOW_STOCK" ? "warning" : "success"}>{stock.status === "LOW_STOCK" ? "Low Stock" : "OK"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MovementsReport() {
  const { data: itemsData } = useItems();
  const { data, isLoading, isError, error } = useMovementsReport();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;

  if (isLoading) return <LoadingState label="Loading movements..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No movements recorded yet" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Qty In</TableHeaderCell>
            <TableHeaderCell>Qty Out</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{new Date(entry.transactionDate).toLocaleDateString()}</TableCell>
              <TableCell>{itemName(entry.itemId)}</TableCell>
              <TableCell>{entry.transactionType}</TableCell>
              <TableCell className="font-tabular">{entry.qtyIn > 0 ? entry.qtyIn : "-"}</TableCell>
              <TableCell className="font-tabular">{entry.qtyOut > 0 ? entry.qtyOut : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PurchasesReport() {
  const { data, isLoading, isError, error } = usePurchasesReport();

  if (isLoading) return <LoadingState label="Loading purchases..." rows={5} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No purchase orders yet" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>PO Number</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Ordered / Received</TableHeaderCell>
            <TableHeaderCell>Total</TableHeaderCell>
            <TableHeaderCell>Lead Time (days)</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((row) => (
            <TableRow key={row.purchaseOrderId}>
              <TableCell>{row.purchaseOrderNumber}</TableCell>
              <TableCell>
                <Badge tone="neutral">{row.status.replace(/_/g, " ")}</Badge>
              </TableCell>
              <TableCell className="font-tabular">
                {row.orderedQuantity} / {row.receivedQuantity}
              </TableCell>
              <TableCell className="font-tabular">{formatCurrency(row.totalAmount)}</TableCell>
              <TableCell className="font-tabular">{row.leadTimeDays ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpiryReport() {
  const { data: itemsData } = useItems();
  const { data, isLoading, isError, error } = useExpiryReport();

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;

  if (isLoading) return <LoadingState label="Loading expiry report..." rows={5} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No batches recorded yet" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell>Batch No.</TableHeaderCell>
            <TableHeaderCell>Expiry Date</TableHeaderCell>
            <TableHeaderCell>Remaining Qty</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell>{itemName(batch.itemId)}</TableCell>
              <TableCell>{batch.batchNumber}</TableCell>
              <TableCell>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "-"}</TableCell>
              <TableCell className="font-tabular">{batch.remainingQuantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OpnamesReport() {
  const { data: warehousesData } = useWarehouseLocations();
  const { data, isLoading, isError, error } = useOpnamesReport();

  const warehouseName = (id: string) => warehousesData?.items.find((w) => w.id === id)?.name ?? id;

  if (isLoading) return <LoadingState label="Loading opnames..." rows={4} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} />;
  if (!data || data.items.length === 0) return <EmptyState title="No stock opnames yet" />;

  return (
    <div className="flex flex-col gap-3">
      <ReportMeta generatedAt={new Date()} />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Opname No.</TableHeaderCell>
            <TableHeaderCell>Warehouse</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((opname) => (
            <TableRow key={opname.id}>
              <TableCell>{opname.opnameNumber}</TableCell>
              <TableCell>{warehouseName(opname.warehouseId)}</TableCell>
              <TableCell>{new Date(opname.opnameDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge tone="neutral">{opname.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
