import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { reservationService } from "../services/reservation.service";
import { CreateReservationInput, UpdateReservationInput } from "../types/reservation.types";

function invalidateReservation(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ["reservations", "list"] });
  queryClient.invalidateQueries({ queryKey: ["reservations", "detail", id] });
}

export function useCreateReservation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReservationInput) => reservationService.create(payload),
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ["reservations", "list"] });
      router.push(`/reservations/${reservation.id}`);
    },
  });
}

export function useUpdateReservation(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateReservationInput) => reservationService.update(id, payload),
    onSuccess: () => {
      invalidateReservation(queryClient, id);
      router.push(`/reservations/${id}`);
    },
  });
}

export function useRescheduleReservation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { reservationDate: string; startTime: string }) => reservationService.reschedule(id, payload),
    onSuccess: () => invalidateReservation(queryClient, id),
  });
}

export function useCancelReservation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) => reservationService.cancel(id, reason),
    onSuccess: () => invalidateReservation(queryClient, id),
  });
}

export function useCheckInReservation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reservationService.checkIn(id),
    onSuccess: () => invalidateReservation(queryClient, id),
  });
}
