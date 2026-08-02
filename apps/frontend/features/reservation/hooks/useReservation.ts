import { useQuery } from "@tanstack/react-query";
import { reservationService } from "../services/reservation.service";

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservations", "detail", id],
    queryFn: () => reservationService.detail(id),
    enabled: Boolean(id),
  });
}
