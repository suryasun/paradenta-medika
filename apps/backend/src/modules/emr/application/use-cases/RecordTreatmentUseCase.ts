import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ITreatmentRepository } from '../../../master-data/domain/repositories/ITreatmentRepository';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';
import { IItemRepository } from '../../../warehouse/domain/repositories/IItemRepository';
import { ItemNotConsumableException, ItemNotFoundException } from '../../../warehouse/domain/exceptions/WarehouseExceptions';
import { TreatmentNotActiveException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { TreatmentEntryResponseDto } from '../dtos/VisitResponseDto';

export interface RecordTreatmentMaterialInput {
  itemId: string;
  quantity: number;
}

export interface RecordTreatmentInput {
  visitId: string;
  treatmentId: string;
  toothReference?: string;
  quantity?: number;
  notes?: string;
  /** docs/03-sad/15-module-emr.md Section 23 "Material Used" (task-136, Epic Z): ad-hoc, per-procedure. */
  materials?: RecordTreatmentMaterialInput[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-053.md: EMR-008/009 combined. Price is snapshotted
 * from the Treatment catalog at entry time (docs/06-tasks/task-025.md:
 * catalog price changes must not retroactively alter historical visits).
 *
 * `materials` (task-136, Epic Z) is validated here against Warehouse's own
 * `IItemRepository` -- a cross-module read through Warehouse's own
 * repository interface, not a raw cross-module Prisma join, matching the
 * discipline already used elsewhere in this session (e.g. Reports'
 * dashboard projections). Actual stock consumption happens later, when
 * CloseVisitUseCase publishes `emr.treatment-material-finalized.v1`; this
 * use case only records what the Doctor says was used and defensively
 * confirms each item exists and is flagged consumable.
 */
export class RecordTreatmentUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly treatmentRepository: ITreatmentRepository,
    private readonly itemRepository: IItemRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordTreatmentInput): Promise<TreatmentEntryResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    const treatment = await this.treatmentRepository.findById(input.treatmentId);
    if (!treatment) {
      throw new MasterDataNotFoundException('Treatment');
    }
    if (!treatment.isActive) {
      throw new TreatmentNotActiveException();
    }

    const materials = input.materials ?? [];
    for (const material of materials) {
      const item = await this.itemRepository.findById(material.itemId);
      if (!item) {
        throw new ItemNotFoundException();
      }
      if (!item.isConsumable) {
        throw new ItemNotConsumableException();
      }
    }

    const quantity = input.quantity ?? 1;
    const unitPrice = Number(treatment.defaultPrice);
    const subtotal = unitPrice * quantity;

    const entry = await this.visitTreatmentRepository.create({
      visitId: input.visitId,
      treatmentId: input.treatmentId,
      toothReference: input.toothReference,
      quantity,
      unitPrice,
      subtotal,
      notes: input.notes,
      createdBy: input.actorUserId,
      materials: materials.length > 0 ? materials : undefined,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'VisitTreatment',
      entry.id,
      'CREATE',
      null,
      { visitId: input.visitId, treatmentId: input.treatmentId, unitPrice, quantity },
      auditContext,
    );

    return {
      id: entry.id,
      treatmentId: entry.treatmentId,
      toothReference: entry.toothReference,
      quantity: entry.quantity,
      unitPrice: Number(entry.unitPrice),
      subtotal: Number(entry.subtotal),
      notes: entry.notes,
      materials: materials.map((m) => ({ itemId: m.itemId, quantity: m.quantity })),
    };
  }
}
