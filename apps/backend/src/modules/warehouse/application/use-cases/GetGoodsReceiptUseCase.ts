import { GoodsReceiptNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IGoodsReceiptRepository } from '../../domain/repositories/IGoodsReceiptRepository';
import { GoodsReceiptResponseDto } from '../dtos/GoodsReceiptResponseDto';
import { toGoodsReceiptResponseDto } from '../mappers/GoodsReceiptMapper';

export class GetGoodsReceiptUseCase {
  constructor(private readonly goodsReceiptRepository: IGoodsReceiptRepository) {}

  async execute(id: string): Promise<GoodsReceiptResponseDto> {
    const receipt = await this.goodsReceiptRepository.findById(id);
    if (!receipt) {
      throw new GoodsReceiptNotFoundException();
    }
    return toGoodsReceiptResponseDto(receipt);
  }
}
