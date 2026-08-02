import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { SupplierCodeExistsException } from '../../domain/exceptions/WarehouseExceptions';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository';
import { SupplierResponseDto } from '../dtos/SupplierResponseDto';
import { toSupplierResponseDto } from '../mappers/SupplierMapper';

export interface CreateSupplierInput {
  code: string;
  name: string;
  picName?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class CreateSupplierUseCase {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateSupplierInput): Promise<SupplierResponseDto> {
    const existing = await this.supplierRepository.findByCode(input.code);
    if (existing) {
      throw new SupplierCodeExistsException();
    }

    const supplier = await this.supplierRepository.create({
      supplierCode: input.code,
      supplierName: input.name,
      picName: input.picName,
      phone: input.phone,
      address: input.address,
      taxNumber: input.taxNumber,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Supplier', supplier.id, 'CREATE', null, { code: input.code, name: input.name }, auditContext);

    return toSupplierResponseDto(supplier);
  }
}
