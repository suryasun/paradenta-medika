import { StockOpnameNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export class GetStockOpnameUseCase {
  constructor(private readonly stockOpnameRepository: IStockOpnameRepository) {}

  async execute(opnameId: string): Promise<StockOpnameResponseDto> {
    const opname = await this.stockOpnameRepository.findById(opnameId);
    if (!opname) {
      throw new StockOpnameNotFoundException();
    }
    return toStockOpnameResponseDto(opname);
  }
}
