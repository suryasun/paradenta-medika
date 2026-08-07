import { useQuery } from "@tanstack/react-query";
import { insuranceProviderService } from "../services/insuranceProvider.service";

export function useInsuranceProviders() {
  return useQuery({
    queryKey: ["insurance-providers", "list"],
    queryFn: () => insuranceProviderService.list(),
  });
}
