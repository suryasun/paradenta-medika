import { CreateReservationForm } from "@/features/reservation/components/CreateReservationForm";

export default function NewReservationPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">New Reservation</h1>
      <CreateReservationForm />
    </div>
  );
}
