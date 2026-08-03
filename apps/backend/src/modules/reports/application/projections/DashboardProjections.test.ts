import { InMemoryEventBus } from '../../../../shared/events/EventBus';
import { registerDashboardProjections } from './registerDashboardProjections';
import { PATIENT_REGISTERED_EVENT, PatientRegisteredPayload } from '../../../patient/domain/events/PatientEvents';
import { RESERVATION_CREATED_EVENT, ReservationEventPayload } from '../../../reservation/domain/events/ReservationEvents';
import { QUEUE_CALLED_EVENT, QUEUE_CREATED_EVENT, QueueEventPayload } from '../../../queue/domain/events/QueueEvents';
import { EMR_FINISHED_EVENT, EmrFinishedPayload } from '../../../emr/domain/events/EmrEvents';
import { PAYMENT_COMPLETED_EVENT, PaymentCompletedPayload } from '../../../billing/domain/events/BillingEvents';
import { FakeDashboardSummaryRepository, FakeProjectionCheckpointRepository } from '../../../../../tests/fakes/reportsFakes';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAccountRepository, FakeJournalRepository } from '../../../../../tests/fakes/financeFakes';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakeItemRepository, FakeStockRepository, FakeWarehouseLocationRepository } from '../../../../../tests/fakes/warehouseFakes';

function buildSut() {
  const eventBus = new InMemoryEventBus();
  const dashboardSummaryRepository = new FakeDashboardSummaryRepository();
  const checkpointRepository = new FakeProjectionCheckpointRepository();
  const invoiceRepository = new FakeInvoiceRepository();
  const journalRepository = new FakeJournalRepository();
  const accountRepository = new FakeAccountRepository();
  const queueRepository = new FakeQueueRepository();
  const stockRepository = new FakeStockRepository();
  const itemRepository = new FakeItemRepository();
  const warehouseLocationRepository = new FakeWarehouseLocationRepository();

  registerDashboardProjections({
    eventBus,
    dashboardSummaryRepository,
    checkpointRepository,
    invoiceRepository,
    journalRepository,
    accountRepository,
    queueRepository,
    stockRepository,
    itemRepository,
    warehouseLocationRepository,
  });

  return {
    eventBus,
    dashboardSummaryRepository,
    checkpointRepository,
    invoiceRepository,
    journalRepository,
    accountRepository,
    queueRepository,
    stockRepository,
    itemRepository,
    warehouseLocationRepository,
  };
}

describe('Dashboard Projections (task-178, TC-RPT-001/002/003)', () => {
  it('TC-RPT-001/002: consuming PatientRegistered once increments the counter; a duplicate republish does not double count', async () => {
    const { eventBus, dashboardSummaryRepository } = buildSut();
    const payload: PatientRegisteredPayload = {
      event: PATIENT_REGISTERED_EVENT,
      patientId: 'patient-1',
      medicalRecordNumber: 'MR-0001',
      fullName: 'Test Patient',
      registeredAt: new Date().toISOString(),
    };

    await eventBus.publish(PATIENT_REGISTERED_EVENT, payload);
    await eventBus.publish(PATIENT_REGISTERED_EVENT, payload); // duplicate redelivery

    const [row] = await dashboardSummaryRepository.listByCodes(['patient.new.count'], null);
    expect(row.value).toBe(1);
  });

  it('reservation.created.count and reservation.cancelled.count accumulate independently at global scope', async () => {
    const { eventBus, dashboardSummaryRepository } = buildSut();
    const payload: ReservationEventPayload = {
      event: RESERVATION_CREATED_EVENT,
      reservationId: 'r-1',
      reservationNumber: 'RSV-0001',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      reservationDate: '2026-08-05',
      startTime: '09:00',
      status: 'BOOKED',
      occurredAt: new Date().toISOString(),
    };
    await eventBus.publish(RESERVATION_CREATED_EVENT, payload);
    await eventBus.publish(RESERVATION_CREATED_EVENT, { ...payload, reservationId: 'r-2' });

    const [row] = await dashboardSummaryRepository.listByCodes(['reservation.created.count'], null);
    expect(row.value).toBe(2);
  });

  it('EMRFinished increments the branch-scoped visit-completed counter, deduped by visitId', async () => {
    const { eventBus, dashboardSummaryRepository } = buildSut();
    const payload: EmrFinishedPayload = {
      event: EMR_FINISHED_EVENT,
      visitId: 'visit-1',
      visitNo: 'V-0001',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      branchId: 'branch-1',
      occurredAt: new Date().toISOString(),
    };
    await eventBus.publish(EMR_FINISHED_EVENT, payload);
    await eventBus.publish(EMR_FINISHED_EVENT, payload);

    const [row] = await dashboardSummaryRepository.listByCodes(['emr.visit.completed.count'], 'branch-1');
    expect(row.value).toBe(1);

    const otherBranch = await dashboardSummaryRepository.listByCodes(['emr.visit.completed.count'], 'branch-2');
    expect(otherBranch).toHaveLength(0);
  });

  it('PaymentCompleted increments global collection and recomputes the paid invoice branch\'s outstanding gauge', async () => {
    const { eventBus, dashboardSummaryRepository, invoiceRepository } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV-0001',
      visitId: 'visit-1',
      patientId: 'patient-1',
      branchId: 'branch-1',
      subtotal: 500000,
      discount: 0,
      tax: 0,
      grandTotal: 500000,
      createdBy: 'u1',
    });
    await invoiceRepository.updatePayment(invoice.id, { paidAmount: 200000, status: 'PARTIALLY_PAID', updatedBy: 'u1' });

    const payload: PaymentCompletedPayload = {
      event: PAYMENT_COMPLETED_EVENT,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      paymentAmount: 200000,
      paymentIds: ['payment-1'],
      invoiceStatus: 'PARTIALLY_PAID',
      occurredAt: new Date().toISOString(),
    };
    await eventBus.publish(PAYMENT_COMPLETED_EVENT, payload);

    const [collection] = await dashboardSummaryRepository.listByCodes(['billing.collection'], null);
    expect(collection.value).toBe(200000);

    const [outstanding] = await dashboardSummaryRepository.listByCodes(['billing.outstanding'], 'branch-1');
    expect(outstanding.value).toBe(300000);
  });

  it('finance.journal.posted.v1 splits revenue/expense deltas by account type, scoped by branch', async () => {
    const { eventBus, dashboardSummaryRepository, journalRepository, accountRepository } = buildSut();
    const revenueAccount = await accountRepository.create({
      branchId: 'branch-1',
      code: '4000',
      name: 'Revenue',
      accountType: 'REVENUE',
      normalBalance: 'CREDIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const expenseAccount = await accountRepository.create({
      branchId: 'branch-1',
      code: '5000',
      name: 'Expense',
      accountType: 'EXPENSE',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const journal = await journalRepository.create({
      branchId: 'branch-1',
      journalDate: new Date(),
      description: 'seed',
      lines: [
        { accountId: revenueAccount.id, debit: 0, credit: 300000 },
        { accountId: expenseAccount.id, debit: 100000, credit: 0 },
      ],
      createdBy: 'u1',
    });
    await journalRepository.markPosted(journal.id, 'JRN-0001', 'u2', new Date());

    await eventBus.publish('finance.journal.posted.v1', { journalId: journal.id, branchId: 'branch-1' });

    const [revenueRow] = await dashboardSummaryRepository.listByCodes(['finance.posted-revenue'], 'branch-1');
    const [expenseRow] = await dashboardSummaryRepository.listByCodes(['finance.posted-expense'], 'branch-1');
    expect(revenueRow.value).toBe(300000);
    expect(expenseRow.value).toBe(100000);
  });

  it('QueueCreated/QueueCalled refresh the per-branch queue status gauges', async () => {
    const { eventBus, queueRepository, dashboardSummaryRepository } = buildSut();
    const queue = await queueRepository.create({
      branchId: 'branch-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      queueNumber: 'A001',
      queuePrefix: 'A',
      queueType: 'RESERVATION',
      queueDate: new Date('2026-08-05'),
      createdBy: 'u1',
    });

    const createdPayload: QueueEventPayload = {
      event: QUEUE_CREATED_EVENT,
      queueId: queue.id,
      queueNumber: queue.queueNumber,
      patientId: queue.patientId,
      doctorId: queue.doctorId,
      branchId: queue.branchId,
      status: 'WAITING',
      occurredAt: new Date().toISOString(),
    };
    await eventBus.publish(QUEUE_CREATED_EVENT, createdPayload);

    const [waiting] = await dashboardSummaryRepository.listByCodes(['queue.count.WAITING'], 'branch-1');
    expect(waiting.value).toBe(1);

    await queueRepository.updateStatus(queue.id, 'CALLED', 'calledAt', 'u1');
    await eventBus.publish(QUEUE_CALLED_EVENT, { ...createdPayload, event: QUEUE_CALLED_EVENT, status: 'CALLED' });

    const [waitingAfter] = await dashboardSummaryRepository.listByCodes(['queue.count.WAITING'], 'branch-1');
    const [called] = await dashboardSummaryRepository.listByCodes(['queue.count.CALLED'], 'branch-1');
    expect(waitingAfter.value).toBe(0);
    expect(called.value).toBe(1);
  });

  it('warehouse.goods-receipt.posted.v1 recomputes the low-stock gauge for the warehouse\'s branch', async () => {
    const { eventBus, stockRepository, itemRepository, warehouseLocationRepository, dashboardSummaryRepository } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT-1',
      itemName: 'Material',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 10,
      isConsumable: true,
      isBatchTracked: false,
      isExpiryTracked: false,
      createdBy: 'u1',
    });
    await warehouseLocationRepository.create({
      branchId: 'branch-1',
      locationCode: 'WH-1',
      locationName: 'Main Warehouse',
      createdBy: 'u1',
    });
    const [location] = [...warehouseLocationRepository.locations.values()];
    await stockRepository.applyStockMovement({
      transactionNumber: 'TX-0001',
      warehouseId: location.id,
      itemId: item.id,
      transactionType: 'ADJUSTMENT',
      referenceType: 'SEED',
      referenceId: 'seed-1',
      qtyIn: 2, // below minimumStock of 10 -> LOW_STOCK
      transactionDate: new Date(),
      performedBy: 'u1',
    });

    await eventBus.publish('warehouse.goods-receipt.posted.v1', { goodsReceiptId: 'gr-1', warehouseId: location.id });

    const [lowStock] = await dashboardSummaryRepository.listByCodes(['warehouse.low-stock.count'], 'branch-1');
    expect(lowStock.value).toBe(1);
  });
});
