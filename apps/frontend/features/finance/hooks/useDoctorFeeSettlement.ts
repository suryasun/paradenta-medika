import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorFeeSettlementService } from "../services/finance.service";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["finance", "doctor-fee-settlements", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["finance", "doctor-fee-settlements", "detail", id] });
}

export function useDoctorFeeSettlements(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "doctor-fee-settlements", "list", params], queryFn: () => doctorFeeSettlementService.list(params) });
}

export function useDoctorFeeSettlement(id: string) {
  return useQuery({
    queryKey: ["finance", "doctor-fee-settlements", "detail", id],
    queryFn: () => doctorFeeSettlementService.detail(id),
    enabled: !!id,
  });
}

export function useGenerateDoctorFeeSettlement() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: doctorFeeSettlementService.generate, onSuccess: () => invalidate(queryClient) });
}

export function useApproveDoctorFeeSettlement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => doctorFeeSettlementService.approve(id), onSuccess: () => invalidate(queryClient, id) });
}

export function usePayDoctorFeeSettlement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cashAccountId: string; paymentDate: string }) => doctorFeeSettlementService.pay(id, payload),
    onSuccess: () => invalidate(queryClient, id),
  });
}
