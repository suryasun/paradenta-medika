import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "../services/billing.service";
import { PaymentLineInput } from "../types/billing.types";

function invalidateInvoice(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ["billing", "invoices", "list"] });
  queryClient.invalidateQueries({ queryKey: ["billing", "invoices", "detail", id] });
}

export function useCloseInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billingService.close(id),
    onSuccess: () => invalidateInvoice(queryClient, id),
  });
}

export function useCreatePayment(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payments: PaymentLineInput[]) => billingService.createPayment(invoiceId, payments),
    onSuccess: () => invalidateInvoice(queryClient, invoiceId),
  });
}
