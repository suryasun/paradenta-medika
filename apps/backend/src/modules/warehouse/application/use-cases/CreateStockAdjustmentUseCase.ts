import { StockAdjustmentDirection } from '@prisma/client';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IStockAdjustmentRepository } from '../../domain/repositories/IStockAdjustmentRepository';
import { StockAdjustmentNumberGenerator } from '../services/StockAdjustmentNumberGenerator';
import { StockAdjustmentItemEntryDto } from '../dtos/StockAdjustmentRequestDto';
import { StockAdjustmentResponseDto } from '../dtos/StockAdjustmentResponseDto';
import { toStockAdjustmentResponseDto } from '../mappers/StockAdjustmentMapper';

export interface CreateStockAdjustmentInput {
  warehouseId: string;
  direction: StockAdjustmentDirection;
  reasonCode: string;
  items: StockAdjustmentItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-122.md: creates a draft awaiting approval; stock is not yet affected. */
export class CreateStockAdjustmentUseCase {
  constructor(
    private readonly stockAdjustmentRepository: IStockAdjustmentRepository,
    private readonly numberGenerator: StockAdjustmentNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateStockAdjustmentInput): Promise<StockAdjustmentResponseDto> {
    const now = new Date();
    const adjustmentNumber = await this.numberGenerator.generate(now);

    const adjustment = await this.stockAdjustmentRepository.create({
      adjustmentNumber,
      warehouseId: input.warehouseId,
      direction: input.direction,
      reasonCode: input.reasonCode,
      items: input.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockAdjustment',
      adjustment.id,
      'CREATE',
      null,
      { adjustmentNumber, warehouseId: input.warehouseId, direction: input.direction, reasonCode: input.reasonCode },
      auditContext,
    );

    return toStockAdjustmentResponseDto(adjustment);
  }
}
