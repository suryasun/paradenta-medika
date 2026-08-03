"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useCashAccounts } from "../hooks/useAccounts";
import { useCashAccountMovements } from "../hooks/useCashAccount";

export function CashAccountMovementsPage() {
  const { data: cashAccountsData } = useCashAccounts();
  const [cashAccountId, setCashAccountId] = useState("");
  const { data, isLoading, isError, error } = useCashAccountMovements(cashAccountId || null);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Cash Account Movements</h1>
      <Select id="movementsCashAccount" label="Cash Account" value={cashAccountId} onChange={(e) => setCashAccountId(e.target.value)} className="max-w-sm">
        <option value="">Select a cash account</option>
        {cashAccountsData?.items.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} ({formatCurrency(account.currentBalance)})
          </option>
        ))}
      </Select>

      {!cashAccountId ? (
        <EmptyState title="Select a cash account" description="Choose an account above to see its posted journal movements." />
      ) : (
        <>
          {isLoading && <LoadingState label="Loading movements..." rows={4} columns={4} />}
          {isError && <ErrorState message={getApiErrorMessage(error)} />}
          {data && data.items.length === 0 && <EmptyState title="No movements yet" />}
          {data && data.items.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Journal No.</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Debit</TableHeaderCell>
                  <TableHeaderCell>Credit</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((movement, index) => (
                  <TableRow key={`${movement.journalId}-${index}`}>
                    <TableCell>{new Date(movement.journalDate).toLocaleDateString()}</TableCell>
                    <TableCell>{movement.journalNo ?? "—"}</TableCell>
                    <TableCell>{movement.description ?? "-"}</TableCell>
                    <TableCell className="font-tabular">{movement.debit > 0 ? formatCurrency(movement.debit) : "-"}</TableCell>
                    <TableCell className="font-tabular">{movement.credit > 0 ? formatCurrency(movement.credit) : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
