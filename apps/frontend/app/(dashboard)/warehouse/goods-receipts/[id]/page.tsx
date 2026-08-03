import { GoodsReceiptDetailPage } from "@/features/warehouse/components/GoodsReceiptDetailPage";

export default async function WarehouseGoodsReceiptDetailPage(props: PageProps<"/warehouse/goods-receipts/[id]">) {
  const { id } = await props.params;
  return <GoodsReceiptDetailPage goodsReceiptId={id} />;
}
