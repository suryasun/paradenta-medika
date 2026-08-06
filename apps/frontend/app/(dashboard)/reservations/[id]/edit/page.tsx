import { EditReservationForm } from "@/features/reservation/components/EditReservationForm";

export default async function EditReservationPage(props: PageProps<"/reservations/[id]/edit">) {
  const { id } = await props.params;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Edit Reservation</h1>
      <EditReservationForm reservationId={id} />
    </div>
  );
}
