import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "../services/billing.service";
import { AddManualChargeInput, ApplyDiscountInput, PaymentLineInput, RefundPaymentInput } from "../types/billing.types";

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

// docs/06-tasks/task-322.md
export function useApplyDiscount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyDiscountInput) => billingService.applyDiscount(id, payload),
    onSuccess: () => invalidateInvoice(queryClient, id),
  });
}

export function useRemoveDiscount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billingService.removeDiscount(id),
    onSuccess: () => invalidateInvoice(queryClient, id),
  });
}

// docs/06-tasks/task-323.md
export function useAddManualCharge(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddManualChargeInput) => billingService.addManualCharge(id, payload),
    onSuccess: () => invalidateInvoice(queryClient, id),
  });
}

// docs/06-tasks/task-324.md
export function useCancelInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => billingService.cancel(id, reason),
    onSuccess: () => invalidateInvoice(queryClient, id),
  });
}

// docs/06-tasks/task-325.md
export function useVoidInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => billingService.void(id, reason),
    onSuccess: () => invalidateInvoice(queryClient, id),
  });
}

// docs/06-tasks/task-326.md
export function useRefundPayment(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: RefundPaymentInput }) =>
      billingService.refundPayment(paymentId, payload),
    onSuccess: () => invalidateInvoice(queryClient, invoiceId),
  });
}
