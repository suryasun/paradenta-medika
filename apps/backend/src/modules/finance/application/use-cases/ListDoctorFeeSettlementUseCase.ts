import { DoctorFeeSettlementStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IDoctorFeeSettlementRepository } from '../../domain/repositories/IDoctorFeeSettlementRepository';
import { ListDoctorFeeSettlementQueryDto } from '../dtos/DoctorFeeSettlementQueryDto';
import { DoctorFeeSettlementResponseDto } from '../dtos/DoctorFeeSettlementResponseDto';
import { toDoctorFeeSettlementResponseDto } from '../mappers/DoctorFeeSettlementMapper';

export class ListDoctorFeeSettlementUseCase {
  constructor(private readonly settlementRepository: IDoctorFeeSettlementRepository) {}

  async execute(query: ListDoctorFeeSettlementQueryDto): Promise<PagedResult<DoctorFeeSettlementResponseDto>> {
    const { items, total } = await this.settlementRepository.list(query, {
      branchId: query.branchId,
      doctorId: query.doctorId,
      status: query.status as DoctorFeeSettlementStatus | undefined,
    });
    return { items: items.map(toDoctorFeeSettlementResponseDto), total };
  }
}
