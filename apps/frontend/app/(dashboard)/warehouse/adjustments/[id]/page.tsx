import { StockAdjustmentDetailPage } from "@/features/warehouse/components/StockAdjustmentDetailPage";

export default async function WarehouseStockAdjustmentDetailPage(props: PageProps<"/warehouse/adjustments/[id]">) {
  const { id } = await props.params;
  return <StockAdjustmentDetailPage adjustmentId={id} />;
}
