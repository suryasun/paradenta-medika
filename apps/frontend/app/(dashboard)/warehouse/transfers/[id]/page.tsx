import { StockTransferDetailPage } from "@/features/warehouse/components/StockTransferDetailPage";

export default async function WarehouseStockTransferDetailPage(props: PageProps<"/warehouse/transfers/[id]">) {
  const { id } = await props.params;
  return <StockTransferDetailPage transferId={id} />;
}
