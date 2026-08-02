import { ReservationDetailView } from "@/features/reservation/components/ReservationDetailView";

export default async function ReservationDetailPage(props: PageProps<"/reservations/[id]">) {
  const { id } = await props.params;
  return <ReservationDetailView reservationId={id} />;
}
