import { useQuery } from "@tanstack/react-query";
import { paymentMethodService } from "../services/paymentMethod.service";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods", "list"],
    queryFn: () => paymentMethodService.list(),
  });
}
