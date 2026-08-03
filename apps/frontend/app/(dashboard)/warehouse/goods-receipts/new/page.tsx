import { Suspense } from "react";
import { GoodsReceiptCreatePage } from "@/features/warehouse/components/GoodsReceiptCreatePage";
import { LoadingState } from "@/components/ui/LoadingState";

export default function WarehouseGoodsReceiptCreatePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading..." />}>
      <GoodsReceiptCreatePage />
    </Suspense>
  );
}
