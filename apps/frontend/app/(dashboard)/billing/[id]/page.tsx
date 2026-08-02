import { InvoiceDetailView } from "@/features/billing/components/InvoiceDetailView";

export default async function InvoiceDetailPage(props: PageProps<"/billing/[id]">) {
  const { id } = await props.params;
  return <InvoiceDetailView invoiceId={id} />;
}
