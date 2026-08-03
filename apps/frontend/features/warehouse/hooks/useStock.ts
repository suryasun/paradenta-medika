import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockService } from "../services/warehouse.service";

export function useStocks(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "stocks", "list", params], queryFn: () => stockService.list(params) });
}

export function useStockLedger(stockId: string | null) {
  return useQuery({
    queryKey: ["warehouse", "stocks", "ledger", stockId],
    queryFn: () => stockService.ledger(stockId as string),
    enabled: !!stockId,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockService.createReservation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] }),
  });
}

export function useReleaseReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => stockService.releaseReservation(reservationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] }),
  });
}
