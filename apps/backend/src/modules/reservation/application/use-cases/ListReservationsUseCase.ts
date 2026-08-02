import { PagedResult } from '../../../../shared/http/pagination';
import { IReservationRepository, ReservationListFilters } from '../../domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export class ListReservationsUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(filters: ReservationListFilters): Promise<PagedResult<ReservationResponseDto>> {
    const { items, total } = await this.reservationRepository.search(filters);
    return { items: items.map(toReservationResponse), total };
  }
}
