import { prisma } from '../../../../shared/infrastructure/prisma';
import { AppendTimelineInput, IReservationTimelineRepository } from '../../domain/repositories/IReservationTimelineRepository';

export class ReservationTimelineRepository implements IReservationTimelineRepository {
  async append(input: AppendTimelineInput): Promise<void> {
    await prisma.reservationTimeline.create({
      data: {
        reservationId: input.reservationId,
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
        note: input.note,
        userId: input.userId,
      },
    });
  }
}
