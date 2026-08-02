import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { WarehouseLocationNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { IWarehouseLocationRepository } from '../../domain/repositories/IWarehouseLocationRepository';
import { PurchaseOrderNumberGenerator } from '../services/PurchaseOrderNumberGenerator';
import { PurchaseOrderItemEntryDto } from '../dtos/PurchaseOrderRequestDto';
import { PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';
import { toPurchaseOrderResponseDto } from '../mappers/PurchaseOrderMapper';

export interface CreatePurchaseOrderInput {
  supplierId: string;
  warehouseId: string;
  expectedDate?: string;
  items: PurchaseOrderItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-105.md; docs/03-sad/18-module-warehouse.md UC-WHS-001
 * step 1-2: creates a `draft` PO with a computed total. `branchId` is not
 * a client-supplied field (Section 8.3: "Server menentukan branch...
 * branchId dari client hanya parameter permintaan") -- it is derived
 * server-side from the target warehouse's own branch, per the same
 * server-derives-branch-scope rule.
 */
export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly warehouseLocationRepository: IWarehouseLocationRepository,
    private readonly numberGenerator: PurchaseOrderNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreatePurchaseOrderInput): Promise<PurchaseOrderResponseDto> {
    const warehouse = await this.warehouseLocationRepository.findById(input.warehouseId);
    if (!warehouse) {
      throw new WarehouseLocationNotFoundException();
    }

    const now = new Date();
    const purchaseOrderNumber = await this.numberGenerator.generate(now);

    const po = await this.purchaseOrderRepository.create({
      purchaseOrderNumber,
      supplierId: input.supplierId,
      branchId: warehouse.branchId,
      warehouseId: input.warehouseId,
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : undefined,
      items: input.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity, unitPrice: item.unitPrice })),
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PurchaseOrder',
      po.id,
      'CREATE',
      null,
      { purchaseOrderNumber, supplierId: input.supplierId, itemCount: input.items.length },
      auditContext,
    );

    return toPurchaseOrderResponseDto(po);
  }
}
