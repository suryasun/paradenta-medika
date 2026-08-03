import { StockOpnameDetailPage } from "@/features/warehouse/components/StockOpnameDetailPage";

export default async function WarehouseStockOpnameDetailPage(props: PageProps<"/warehouse/stock-opnames/[id]">) {
  const { id } = await props.params;
  return <StockOpnameDetailPage opnameId={id} />;
}
