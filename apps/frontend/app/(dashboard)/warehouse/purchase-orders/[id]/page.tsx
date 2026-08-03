import { PurchaseOrderDetailPage } from "@/features/warehouse/components/PurchaseOrderDetailPage";

export default async function WarehousePurchaseOrderDetailPage(props: PageProps<"/warehouse/purchase-orders/[id]">) {
  const { id } = await props.params;
  return <PurchaseOrderDetailPage purchaseOrderId={id} />;
}
