import { useQuery } from "@tanstack/react-query";
import { reservationService } from "../services/reservation.service";

export function useDoctorTimeSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ["reservations", "time-slots", doctorId, date],
    queryFn: () => reservationService.getTimeSlots(doctorId, date),
    enabled: Boolean(doctorId) && Boolean(date),
  });
}
