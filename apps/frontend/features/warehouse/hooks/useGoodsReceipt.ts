import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goodsReceiptService } from "../services/warehouse.service";

export function useGoodsReceipt(id: string) {
  return useQuery({ queryKey: ["warehouse", "goods-receipts", "detail", id], queryFn: () => goodsReceiptService.detail(id), enabled: !!id });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goodsReceiptService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouse", "purchase-orders"] }),
  });
}

export function usePostGoodsReceipt(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => goodsReceiptService.postReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", "goods-receipts", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["warehouse", "purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] });
    },
  });
}
