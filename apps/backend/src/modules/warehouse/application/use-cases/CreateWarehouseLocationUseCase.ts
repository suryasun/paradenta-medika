import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { WarehouseLocationCodeExistsException } from '../../domain/exceptions/WarehouseExceptions';
import { IWarehouseLocationRepository } from '../../domain/repositories/IWarehouseLocationRepository';
import { WarehouseLocationResponseDto } from '../dtos/WarehouseLocationResponseDto';
import { toWarehouseLocationResponseDto } from '../mappers/WarehouseLocationMapper';

export interface CreateWarehouseLocationInput {
  branchId: string;
  code: string;
  name: string;
  locationType?: string;
  address?: string;
  managerUserId?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-101.md AC: "duplicate code within a branch rejected." */
export class CreateWarehouseLocationUseCase {
  constructor(
    private readonly warehouseLocationRepository: IWarehouseLocationRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateWarehouseLocationInput): Promise<WarehouseLocationResponseDto> {
    const existing = await this.warehouseLocationRepository.findByBranchAndCode(input.branchId, input.code);
    if (existing) {
      throw new WarehouseLocationCodeExistsException();
    }

    const location = await this.warehouseLocationRepository.create({
      branchId: input.branchId,
      locationCode: input.code,
      locationName: input.name,
      locationType: input.locationType,
      address: input.address,
      managerUserId: input.managerUserId,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'WarehouseLocation',
      location.id,
      'CREATE',
      null,
      { code: input.code, name: input.name, branchId: input.branchId },
      auditContext,
    );

    return toWarehouseLocationResponseDto(location);
  }
}
