import { CreatePurchaseOrderUseCase } from './CreatePurchaseOrderUseCase';
import { SubmitPurchaseOrderUseCase } from './SubmitPurchaseOrderUseCase';
import { ApprovePurchaseOrderUseCase } from './ApprovePurchaseOrderUseCase';
import { RejectPurchaseOrderUseCase } from './RejectPurchaseOrderUseCase';
import { CancelPurchaseOrderUseCase } from './CancelPurchaseOrderUseCase';
import { UpdatePurchaseOrderUseCase } from './UpdatePurchaseOrderUseCase';
import { PurchaseOrderNumberGenerator } from '../services/PurchaseOrderNumberGenerator';
import { FakePurchaseOrderRepository, FakeWarehouseLocationRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import {
  PurchaseOrderHasPostedReceiptsException,
  PurchaseOrderNotDraftException,
  PurchaseOrderNotInStatusException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';

async function buildSut() {
  const purchaseOrderRepository = new FakePurchaseOrderRepository();
  const warehouseLocationRepository = new FakeWarehouseLocationRepository();
  const auditService = new FakeAuditService();
  const warehouse = await warehouseLocationRepository.create({
    branchId: 'branch-1',
    locationCode: 'WH-01',
    locationName: 'Main Warehouse',
    createdBy: 'u1',
  });
  const createUseCase = new CreatePurchaseOrderUseCase(
    purchaseOrderRepository,
    warehouseLocationRepository,
    new PurchaseOrderNumberGenerator(purchaseOrderRepository),
    auditService,
  );
  const submitUseCase = new SubmitPurchaseOrderUseCase(purchaseOrderRepository, auditService);
  const approveUseCase = new ApprovePurchaseOrderUseCase(purchaseOrderRepository, auditService);
  const rejectUseCase = new RejectPurchaseOrderUseCase(purchaseOrderRepository, auditService);
  const cancelUseCase = new CancelPurchaseOrderUseCase(purchaseOrderRepository, auditService);
  return { purchaseOrderRepository, warehouse, createUseCase, submitUseCase, approveUseCase, rejectUseCase, cancelUseCase };
}

describe('Purchase Order lifecycle (task-104-110, UC-WHS-001)', () => {
  it('creates a draft PO with a computed total', async () => {
    const { warehouse, createUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 10, unitPrice: 5000 }],
      actorUserId: 'requester-1',
    });
    expect(po.status).toBe('DRAFT');
    expect(po.totalAmount).toBe(50000);
    expect(po.branchId).toBe('branch-1');
  });

  it('rejects submitting a non-draft PO', async () => {
    const { warehouse, createUseCase, submitUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 1, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await expect(submitUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' })).rejects.toBeInstanceOf(
      PurchaseOrderNotInStatusException,
    );
  });

  it('rejects self-approval (maker-checker)', async () => {
    const { warehouse, createUseCase, submitUseCase, approveUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 1, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await expect(approveUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' })).rejects.toBeInstanceOf(
      WarehouseSegregationOfDutiesException,
    );
  });

  it('allows approval by a different user', async () => {
    const { warehouse, createUseCase, submitUseCase, approveUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 1, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    const approved = await approveUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('manager-1');
  });

  it('requires a reason to reject', async () => {
    const { warehouse, createUseCase, submitUseCase, rejectUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 1, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    const rejected = await rejectUseCase.execute({ purchaseOrderId: po.id, reason: 'Price too high', actorUserId: 'manager-1' });
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toBe('Price too high');
  });

  it('rejects editing a PO once it is no longer draft', async () => {
    const { purchaseOrderRepository, warehouse, createUseCase, submitUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 1, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });

    const updateUseCase = new UpdatePurchaseOrderUseCase(purchaseOrderRepository, new FakeAuditService());
    await expect(
      updateUseCase.execute({ purchaseOrderId: po.id, warehouseId: warehouse.id, actorUserId: 'requester-1' }),
    ).rejects.toBeInstanceOf(PurchaseOrderNotDraftException);
  });

  it('rejects cancellation once a Goods Receipt has been posted', async () => {
    const { purchaseOrderRepository, warehouse, createUseCase, submitUseCase, approveUseCase, cancelUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 1, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await approveUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });
    purchaseOrderRepository.postedReceiptPurchaseOrderIds.add(po.id);

    await expect(cancelUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      PurchaseOrderHasPostedReceiptsException,
    );
  });

  it('allows cancellation before any Goods Receipt is posted', async () => {
    const { warehouse, createUseCase, cancelUseCase } = await buildSut();
    const po = await createUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: 'item-1', quantity: 1, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    const cancelled = await cancelUseCase.execute({ purchaseOrderId: po.id, reason: 'No longer needed', actorUserId: 'requester-1' });
    expect(cancelled.status).toBe('CANCELLED');
  });
});
