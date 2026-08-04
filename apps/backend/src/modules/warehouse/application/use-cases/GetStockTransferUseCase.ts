import { StockTransferNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';
import { StockTransferResponseDto } from '../dtos/StockTransferResponseDto';
import { toStockTransferResponseDto } from '../mappers/StockTransferMapper';

export class GetStockTransferUseCase {
  constructor(private readonly stockTransferRepository: IStockTransferRepository) {}

  async execute(transferId: string): Promise<StockTransferResponseDto> {
    const transfer = await this.stockTransferRepository.findById(transferId);
    if (!transfer) {
      throw new StockTransferNotFoundException();
    }
    return toStockTransferResponseDto(transfer);
  }
}
