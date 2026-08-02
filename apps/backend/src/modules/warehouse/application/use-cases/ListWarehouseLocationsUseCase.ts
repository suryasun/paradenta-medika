import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { IWarehouseLocationRepository } from '../../domain/repositories/IWarehouseLocationRepository';
import { WarehouseLocationResponseDto } from '../dtos/WarehouseLocationResponseDto';
import { toWarehouseLocationResponseDto } from '../mappers/WarehouseLocationMapper';

export class ListWarehouseLocationsUseCase {
  constructor(private readonly warehouseLocationRepository: IWarehouseLocationRepository) {}

  async execute(query: ListQueryDto): Promise<PagedResult<WarehouseLocationResponseDto>> {
    const { items, total } = await this.warehouseLocationRepository.list(query);
    return { items: items.map(toWarehouseLocationResponseDto), total };
  }
}
