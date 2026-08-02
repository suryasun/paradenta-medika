import { useQuery } from "@tanstack/react-query";
import { reservationService } from "../services/reservation.service";
import { ListReservationsParams } from "../types/reservation.types";

export function useReservations(params: ListReservationsParams) {
  return useQuery({
    queryKey: ["reservations", "list", params],
    queryFn: () => reservationService.list(params),
    placeholderData: (previous) => previous,
  });
}
