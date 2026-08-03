import { useQuery } from "@tanstack/react-query";
import { reservationService } from "../services/reservation.service";

// docs/02-design/pages/reservation.md §8: slot availability should reflect
// a concurrent booking without the user re-selecting the date (this is
// the exact race SAD §15.4 already treats as a rejectable
// double-booking error server-side -- catching it live, before submit, is
// strictly better than reject-after-submit). Plain react-query polling,
// no new infra.
export function useDoctorTimeSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ["reservations", "time-slots", doctorId, date],
    queryFn: () => reservationService.getTimeSlots(doctorId, date),
    enabled: Boolean(doctorId) && Boolean(date),
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  });
}
