import { CheckBranchHasOpenTransactionsUseCase } from './CheckBranchHasOpenTransactionsUseCase';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakePurchaseOrderRepository, FakeGoodsReceiptRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeJournalRepository } from '../../../../../tests/fakes/financeFakes';

const BRANCH = 'branch-1';

function buildUseCase() {
  const reservationRepository = new FakeReservationRepository();
  const queueRepository = new FakeQueueRepository();
  const invoiceRepository = new FakeInvoiceRepository();
  const purchaseOrderRepository = new FakePurchaseOrderRepository();
  const goodsReceiptRepository = new FakeGoodsReceiptRepository();
  const journalRepository = new FakeJournalRepository();
  const useCase = new CheckBranchHasOpenTransactionsUseCase(
    reservationRepository,
    queueRepository,
    invoiceRepository,
    purchaseOrderRepository,
    goodsReceiptRepository,
    journalRepository,
  );
  return { useCase, reservationRepository, queueRepository, invoiceRepository, purchaseOrderRepository, goodsReceiptRepository, journalRepository };
}

describe('task-225: CheckBranchHasOpenTransactionsUseCase', () => {
  it('allows deactivation when no module has an open transaction', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute(BRANCH);

    expect(result).toEqual({ hasOpenTransactions: false, blockedByModules: [] });
  });

  it('blocks on an open (non-terminal) Reservation', async () => {
    const { useCase, reservationRepository } = buildUseCase();
    await reservationRepository.create({
      reservationNo: 'R-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: BRANCH,
      reservationDate: new Date(),
      reservationTime: new Date(),
      reservationType: 'APPOINTMENT',
      source: 'WALK_IN',
      createdBy: 'admin-1',
    });

    const result = await useCase.execute(BRANCH);

    expect(result.hasOpenTransactions).toBe(true);
    expect(result.blockedByModules).toContain('Reservation');
  });

  it('blocks on an unclosed Queue entry', async () => {
    const { useCase, queueRepository } = buildUseCase();
    await queueRepository.create({
      branchId: BRANCH,
      patientId: 'p1',
      doctorId: 'd1',
      queueNumber: 'A-001',
      queuePrefix: 'A',
      queueDate: new Date(),
      queueType: 'WALK_IN',
      createdBy: 'admin-1',
    });

    const result = await useCase.execute(BRANCH);

    expect(result.blockedByModules).toContain('Queue');
  });

  it('blocks on an unpaid Invoice', async () => {
    const { useCase, invoiceRepository } = buildUseCase();
    await invoiceRepository.create({
      invoiceNo: 'INV-1',
      visitId: 'v1',
      patientId: 'p1',
      branchId: BRANCH,
      subtotal: 100000,
      discount: 0,
      tax: 0,
      grandTotal: 100000,
      createdBy: 'admin-1',
    });

    const result = await useCase.execute(BRANCH);

    expect(result.blockedByModules).toContain('Billing');
  });

  it('blocks on an open Purchase Order', async () => {
    const { useCase, purchaseOrderRepository } = buildUseCase();
    await purchaseOrderRepository.create({
      purchaseOrderNumber: 'PO-1',
      supplierId: 's1',
      branchId: BRANCH,
      warehouseId: 'w1',
      items: [{ itemId: 'item-1', quantity: 10, unitPrice: 1000 }],
      createdBy: 'admin-1',
    });

    const result = await useCase.execute(BRANCH);

    expect(result.blockedByModules).toContain('Warehouse (Purchase Order)');
  });

  it('blocks on an unposted (DRAFT) Goods Receipt', async () => {
    const { useCase, goodsReceiptRepository } = buildUseCase();
    goodsReceiptRepository.seedWarehouseBranch('w1', BRANCH);
    await goodsReceiptRepository.create({
      goodsReceiptNumber: 'GR-1',
      purchaseOrderId: 'po-1',
      warehouseId: 'w1',
      receiptDate: new Date(),
      items: [{ purchaseOrderItemId: 'poi-1', itemId: 'item-1', quantity: 10, unitCost: 1000 }],
      createdBy: 'admin-1',
    });

    const result = await useCase.execute(BRANCH);

    expect(result.blockedByModules).toContain('Warehouse (Goods Receipt)');
  });

  it('blocks on an unposted (DRAFT) Journal', async () => {
    const { useCase, journalRepository } = buildUseCase();
    await journalRepository.create({
      branchId: BRANCH,
      journalDate: new Date(),
      description: 'Test journal',
      lines: [
        { accountId: 'a1', debit: 100000, credit: 0 },
        { accountId: 'a2', debit: 0, credit: 100000 },
      ],
      createdBy: 'admin-1',
    });

    const result = await useCase.execute(BRANCH);

    expect(result.blockedByModules).toContain('Finance');
  });

  it('lists every blocking module, not just the first one found', async () => {
    const { useCase, reservationRepository, queueRepository } = buildUseCase();
    await reservationRepository.create({
      reservationNo: 'R-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: BRANCH,
      reservationDate: new Date(),
      reservationTime: new Date(),
      reservationType: 'APPOINTMENT',
      source: 'WALK_IN',
      createdBy: 'admin-1',
    });
    await queueRepository.create({
      branchId: BRANCH,
      patientId: 'p1',
      doctorId: 'd1',
      queueNumber: 'A-001',
      queuePrefix: 'A',
      queueDate: new Date(),
      queueType: 'WALK_IN',
      createdBy: 'admin-1',
    });

    const result = await useCase.execute(BRANCH);

    expect(result.blockedByModules).toEqual(expect.arrayContaining(['Reservation', 'Queue']));
    expect(result.blockedByModules).toHaveLength(2);
  });
});
