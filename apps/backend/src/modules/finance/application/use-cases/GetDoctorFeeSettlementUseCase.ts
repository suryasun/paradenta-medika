import { DoctorFeeSettlementNotFoundException } from '../../domain/exceptions/FinanceExceptions';
import { IDoctorFeeSettlementRepository } from '../../domain/repositories/IDoctorFeeSettlementRepository';
import { DoctorFeeSettlementResponseDto } from '../dtos/DoctorFeeSettlementResponseDto';
import { toDoctorFeeSettlementResponseDto } from '../mappers/DoctorFeeSettlementMapper';

export class GetDoctorFeeSettlementUseCase {
  constructor(private readonly settlementRepository: IDoctorFeeSettlementRepository) {}

  async execute(settlementId: string): Promise<DoctorFeeSettlementResponseDto> {
    const settlement = await this.settlementRepository.findById(settlementId);
    if (!settlement) {
      throw new DoctorFeeSettlementNotFoundException();
    }
    return toDoctorFeeSettlementResponseDto(settlement);
  }
}
