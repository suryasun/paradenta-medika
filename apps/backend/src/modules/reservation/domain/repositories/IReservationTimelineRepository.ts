export interface AppendTimelineInput {
  reservationId: string;
  previousStatus: string | null;
  newStatus: string;
  note?: string;
  userId: string;
}

export interface IReservationTimelineRepository {
  append(input: AppendTimelineInput): Promise<void>;
}
