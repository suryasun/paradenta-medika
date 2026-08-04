import { DoctorFeeSettlementDetailPage } from "@/features/finance/components/DoctorFeeSettlementDetailPage";

export default async function FinanceDoctorFeeSettlementDetailPage(props: PageProps<"/finance/doctor-fee-settlements/[id]">) {
  const { id } = await props.params;
  return <DoctorFeeSettlementDetailPage settlementId={id} />;
}
