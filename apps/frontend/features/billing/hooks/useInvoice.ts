import { useQuery } from "@tanstack/react-query";
import { billingService } from "../services/billing.service";

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["billing", "invoices", "detail", id],
    queryFn: () => billingService.detail(id),
    enabled: Boolean(id),
  });
}
