"use client";

import { FormEvent, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCashAccounts } from "../hooks/useAccounts";
import { useCreateCashTransfer } from "../hooks/useCashAccount";

export function CashTransferPage() {
  const { data: cashAccountsData } = useCashAccounts();
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceCashAccountId, setSourceCashAccountId] = useState("");
  const [destinationCashAccountId, setDestinationCashAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const createTransfer = useCreateCashTransfer();

  const sameAccount = !!sourceCashAccountId && sourceCashAccountId === destinationCashAccountId;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceCashAccountId || !destinationCashAccountId || sameAccount || !amount) return;
    createTransfer.mutate(
      { transferDate, sourceCashAccountId, destinationCashAccountId, amount: Number(amount), description: description || undefined },
      { onSuccess: () => { setAmount(""); setDescription(""); } },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Cash Transfer</h1>
      <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3 rounded-lg border border-border p-4">
        <Input id="transferDate" label="Transfer Date" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required />
        <Select id="transferSource" label="Source Account" value={sourceCashAccountId} onChange={(e) => setSourceCashAccountId(e.target.value)} required>
          <option value="">Select source</option>
          {cashAccountsData?.items.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <Select id="transferDestination" label="Destination Account" value={destinationCashAccountId} onChange={(e) => setDestinationCashAccountId(e.target.value)} required>
          <option value="">Select destination</option>
          {cashAccountsData?.items.map((account) => (
            <option key={account.id} value={account.id} disabled={account.id === sourceCashAccountId}>
              {account.name}
            </option>
          ))}
        </Select>
        {sameAccount && <p className="text-xs text-error">Source and destination must be different accounts.</p>}
        <Input id="transferAmount" label="Amount" type="number" min={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Textarea id="transferDescription" label="Reason (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

        {createTransfer.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createTransfer.error)}
          </p>
        )}
        {createTransfer.isSuccess && <p className="text-sm text-success">Transfer completed.</p>}
        <Button type="submit" isLoading={createTransfer.isPending} disabled={!sourceCashAccountId || !destinationCashAccountId || sameAccount || !amount}>
          <ArrowRightLeft size={14} strokeWidth={1.75} aria-hidden="true" />
          Transfer
        </Button>
      </form>
    </div>
  );
}
