import { useMutation } from "@tanstack/react-query";
import { doctorFeeSettlementService } from "../services/finance.service";

export function useGenerateDoctorFeeSettlement() {
  return useMutation({ mutationFn: doctorFeeSettlementService.generate });
}

export function useApproveDoctorFeeSettlement() {
  return useMutation({ mutationFn: (id: string) => doctorFeeSettlementService.approve(id) });
}

export function usePayDoctorFeeSettlement() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { cashAccountId: string; paymentDate: string } }) =>
      doctorFeeSettlementService.pay(id, payload),
  });
}
