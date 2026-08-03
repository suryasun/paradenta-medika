import { useQuery } from "@tanstack/react-query";
import { warehouseReportsService } from "../services/warehouse.service";

export function useStockCardReport(params: { warehouseId?: string; itemId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["warehouse", "reports", "stock-card", params],
    queryFn: () => warehouseReportsService.stockCard(params),
    enabled: !!params.warehouseId && !!params.itemId,
  });
}

export function useStockBalanceReport(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "reports", "stock-balance", params], queryFn: () => warehouseReportsService.stockBalance(params) });
}

export function useMovementsReport(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "reports", "movements", params], queryFn: () => warehouseReportsService.movements(params) });
}

export function usePurchasesReport(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "reports", "purchases", params], queryFn: () => warehouseReportsService.purchases(params) });
}

export function useExpiryReport(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "reports", "expiry", params], queryFn: () => warehouseReportsService.expiry(params) });
}

export function useOpnamesReport(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "reports", "opnames", params], queryFn: () => warehouseReportsService.opnames(params) });
}
