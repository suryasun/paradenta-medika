import { ReservationNotFoundException } from '../../domain/exceptions/ReservationExceptions';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export class GetReservationUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(id: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new ReservationNotFoundException();
    }
    return toReservationResponse(reservation);
  }
}
