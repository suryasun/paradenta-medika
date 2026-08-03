"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList, Send, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useItems } from "../hooks/useWarehouseCatalogs";
import { useApproveStockOpname, usePostStockOpname, useStartStockOpnameCount, useStockOpname, useSubmitStockOpnameCount } from "../hooks/useStockOpname";

export function StockOpnameDetailPage({ opnameId }: { opnameId: string }) {
  const { data: opname, isLoading, isError, error, refetch } = useStockOpname(opnameId);
  const { data: itemsData } = useItems();
  const startCount = useStartStockOpnameCount(opnameId);
  const submitCount = useSubmitStockOpnameCount(opnameId);
  const approveOpname = useApproveStockOpname(opnameId);
  const postOpname = usePostStockOpname(opnameId);
  const [counts, setCounts] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingState label="Loading stock opname..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!opname) return null;

  const itemName = (id: string) => itemsData?.items.find((i) => i.id === id)?.name ?? id;
  const mutationError = startCount.error ?? submitCount.error ?? approveOpname.error ?? postOpname.error;

  function handleSubmitCount() {
    const items = opname!.items
      .map((item) => {
        const value = counts[item.itemId];
        if (value === undefined || value === "") return null;
        return { itemId: item.itemId, physicalQuantity: Number(value) };
      })
      .filter((entry): entry is { itemId: string; physicalQuantity: number } => entry !== null);
    if (items.length === 0) return;
    submitCount.mutate(items);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">{opname.opnameNumber}</h1>
        <Badge tone={opname.status === "POSTED" ? "success" : opname.status === "REJECTED" ? "error" : "info"}>{opname.status}</Badge>
      </div>

      {mutationError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(mutationError)}
        </p>
      )}

      {opname.status === "DRAFT" && (
        <PermissionGuard permission="warehouse.opname.count">
          <Button isLoading={startCount.isPending} onClick={() => startCount.mutate()} className="self-start">
            <ClipboardList size={14} strokeWidth={1.75} aria-hidden="true" />
            Start Count
          </Button>
        </PermissionGuard>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell>System Qty</TableHeaderCell>
            <TableHeaderCell>Physical Qty</TableHeaderCell>
            <TableHeaderCell>Variance</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {opname.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{itemName(item.itemId)}</TableCell>
              <TableCell className="font-tabular">{item.systemQuantity ?? "-"}</TableCell>
              <TableCell className="font-tabular">
                {opname.status === "COUNTING" ? (
                  <Input
                    id={`count-${item.itemId}`}
                    type="number"
                    min={0}
                    value={counts[item.itemId] ?? ""}
                    onChange={(e) => setCounts((prev) => ({ ...prev, [item.itemId]: e.target.value }))}
                    className="w-24"
                  />
                ) : (
                  (item.physicalQuantity ?? "-")
                )}
              </TableCell>
              <TableCell className="font-tabular">{item.variance ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {opname.status === "COUNTING" && (
        <PermissionGuard permission="warehouse.opname.count">
          <Button isLoading={submitCount.isPending} onClick={handleSubmitCount} className="self-start">
            <Send size={14} strokeWidth={1.75} aria-hidden="true" />
            Submit Count
          </Button>
        </PermissionGuard>
      )}
      {opname.status === "SUBMITTED" && (
        <PermissionGuard permission="warehouse.opname.approve">
          <Button isLoading={approveOpname.isPending} onClick={() => approveOpname.mutate()} className="self-start">
            <ThumbsUp size={14} strokeWidth={1.75} aria-hidden="true" />
            Approve
          </Button>
        </PermissionGuard>
      )}
      {opname.status === "APPROVED" && (
        <PermissionGuard permission="warehouse.opname.post">
          <Button isLoading={postOpname.isPending} onClick={() => postOpname.mutate()} className="self-start">
            <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Post
          </Button>
        </PermissionGuard>
      )}
      {opname.status === "POSTED" && <p className="text-sm text-success">Opname posted — stock adjusted to match the physical count.</p>}
    </div>
  );
}
