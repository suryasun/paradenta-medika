import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import {
  CreateReservationInput,
  ListReservationsParams,
  Reservation,
  TimeSlot,
  UpdateReservationInput,
} from "../types/reservation.types";

// docs/06-tasks/task-002.md, task-031.md..task-036.md
export const reservationService = {
  async list(params: ListReservationsParams): Promise<{ items: Reservation[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Reservation[]>>("/reservations", { params });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async detail(id: string): Promise<Reservation> {
    const response = await apiClient.get<ApiSuccessBody<Reservation>>(`/reservations/${id}`);
    return response.data.data;
  },

  async create(payload: CreateReservationInput): Promise<Reservation> {
    const response = await apiClient.post<ApiSuccessBody<Reservation>>("/reservations", payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateReservationInput): Promise<Reservation> {
    const response = await apiClient.put<ApiSuccessBody<Reservation>>(`/reservations/${id}`, payload);
    return response.data.data;
  },

  async reschedule(id: string, payload: { reservationDate: string; startTime: string }): Promise<Reservation> {
    const response = await apiClient.patch<ApiSuccessBody<Reservation>>(`/reservations/${id}/reschedule`, payload);
    return response.data.data;
  },

  async cancel(id: string, reason: string): Promise<Reservation> {
    const response = await apiClient.patch<ApiSuccessBody<Reservation>>(`/reservations/${id}/cancel`, { reason });
    return response.data.data;
  },

  async checkIn(id: string): Promise<Reservation> {
    const response = await apiClient.patch<ApiSuccessBody<Reservation>>(`/reservations/${id}/check-in`);
    return response.data.data;
  },

  async getTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    const response = await apiClient.get<ApiSuccessBody<TimeSlot[]>>(`/doctors/${doctorId}/time-slots`, { params: { date } });
    return response.data.data;
  },
};
