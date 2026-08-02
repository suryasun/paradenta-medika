import { useQuery } from "@tanstack/react-query";
import { reservationService } from "../services/reservation.service";
import { ReservationAnalyticsParams } from "../types/reservation.types";

export function useReservationAnalytics(params: ReservationAnalyticsParams) {
  return useQuery({
    queryKey: ["reservations", "analytics", params],
    queryFn: () => reservationService.analytics(params),
  });
}
