import { useQuery } from "@tanstack/react-query";
import { billingService } from "../services/billing.service";
import { ListInvoicesParams } from "../types/billing.types";

export function useInvoices(params: ListInvoicesParams) {
  return useQuery({
    queryKey: ["billing", "invoices", "list", params],
    queryFn: () => billingService.list(params),
    placeholderData: (previous) => previous,
  });
}
