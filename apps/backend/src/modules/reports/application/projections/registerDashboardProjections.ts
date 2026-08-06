import { IEventBus } from '../../../../shared/events/EventBus';
import { PATIENT_REGISTERED_EVENT, PatientRegisteredPayload } from '../../../patient/domain/events/PatientEvents';
import {
  RESERVATION_CANCELLED_EVENT,
  RESERVATION_CREATED_EVENT,
  ReservationEventPayload,
} from '../../../reservation/domain/events/ReservationEvents';
import { QUEUE_CALLED_EVENT, QUEUE_COMPLETED_EVENT, QUEUE_CREATED_EVENT, QueueEventPayload } from '../../../queue/domain/events/QueueEvents';
import { EMR_FINISHED_EVENT, EmrFinishedPayload } from '../../../emr/domain/events/EmrEvents';
import { PAYMENT_COMPLETED_EVENT, PaymentCompletedPayload } from '../../../billing/domain/events/BillingEvents';
import { IInvoiceRepository } from '../../../billing/domain/repositories/IInvoiceRepository';
import { IJournalRepository } from '../../../finance/domain/repositories/IJournalRepository';
import { IAccountRepository } from '../../../finance/domain/repositories/IAccountRepository';
import { IQueueRepository } from '../../../queue/domain/repositories/IQueueRepository';
import { IStockRepository } from '../../../warehouse/domain/repositories/IStockRepository';
import { IItemRepository } from '../../../warehouse/domain/repositories/IItemRepository';
import { IWarehouseLocationRepository } from '../../../warehouse/domain/repositories/IWarehouseLocationRepository';
import { IDashboardSummaryRepository } from '../../domain/repositories/IDashboardSummaryRepository';
import { IProjectionCheckpointRepository } from '../../domain/repositories/IProjectionCheckpointRepository';
import { DEFINITION_VERSION } from '../services/MetricDefinitions';

interface JournalPostedLikePayload {
  journalId: string;
  branchId: string;
}

export interface RegisterDashboardProjectionsDeps {
  eventBus: IEventBus;
  dashboardSummaryRepository: IDashboardSummaryRepository;
  checkpointRepository: IProjectionCheckpointRepository;
  invoiceRepository: IInvoiceRepository;
  journalRepository: IJournalRepository;
  accountRepository: IAccountRepository;
  queueRepository: IQueueRepository;
  stockRepository: IStockRepository;
  itemRepository: IItemRepository;
  warehouseLocationRepository: IWarehouseLocationRepository;
}

/**
 * docs/03-sad/20-module-report.md Section 2.4/7.2: projection handlers
 * subscribed to source-module events, each guarded by an idempotent
 * checkpoint claim (TC-RPT-001/002/003). Registered once from
 * buildReportsModule, the same composition-root pattern Billing already
 * uses for its own EMRFinished subscription.
 */
export function registerDashboardProjections(deps: RegisterDashboardProjectionsDeps): void {
  const {
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
  } = deps;

  eventBus.subscribe<PatientRegisteredPayload>(PATIENT_REGISTERED_EVENT, async (payload) => {
    if (!(await checkpointRepository.claim('reports.patient.new', payload.patientId))) return;
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'patient.new.count',
      branchId: null,
      value: 1,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });
  });

  eventBus.subscribe<ReservationEventPayload>(RESERVATION_CREATED_EVENT, async (payload) => {
    if (!(await checkpointRepository.claim('reports.reservation.created', payload.reservationId))) return;
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'reservation.created.count',
      branchId: null,
      value: 1,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });
  });

  eventBus.subscribe<ReservationEventPayload>(RESERVATION_CANCELLED_EVENT, async (payload) => {
    if (!(await checkpointRepository.claim('reports.reservation.cancelled', payload.reservationId))) return;
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'reservation.cancelled.count',
      branchId: null,
      value: 1,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });
  });

  eventBus.subscribe<EmrFinishedPayload>(EMR_FINISHED_EVENT, async (payload) => {
    if (!(await checkpointRepository.claim('reports.emr.visit-completed', payload.visitId))) return;
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'emr.visit.completed.count',
      branchId: payload.branchId,
      value: 1,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });
  });

  eventBus.subscribe<PaymentCompletedPayload>(PAYMENT_COMPLETED_EVENT, async (payload) => {
    const sourceKey = `${payload.invoiceId}:${payload.occurredAt}`;
    if (!(await checkpointRepository.claim('reports.billing.payment-completed', sourceKey))) return;

    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'billing.collection',
      branchId: null,
      value: payload.paymentAmount,
      currency: 'IDR',
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });

    const invoice = await invoiceRepository.findById(payload.invoiceId);
    if (invoice) {
      const outstanding = await invoiceRepository.sumOutstandingByBranch(invoice.branchId);
      await dashboardSummaryRepository.upsertSet({
        metricCode: 'billing.outstanding',
        branchId: invoice.branchId,
        value: outstanding,
        currency: 'IDR',
        dataAsOf: new Date(),
        definitionVersion: DEFINITION_VERSION,
      });
    }
  });

  const applyJournalRevenueExpenseDelta = async (checkpointKey: string, payload: JournalPostedLikePayload) => {
    if (!(await checkpointRepository.claim(checkpointKey, payload.journalId))) return;
    const journal = await journalRepository.findById(payload.journalId);
    if (!journal) return;

    let revenueDelta = 0;
    let expenseDelta = 0;
    for (const line of journal.lines) {
      const account = await accountRepository.findById(line.accountId);
      if (!account) continue;
      if (account.accountType === 'REVENUE') {
        revenueDelta += Number(line.credit) - Number(line.debit);
      } else if (account.accountType === 'EXPENSE') {
        expenseDelta += Number(line.debit) - Number(line.credit);
      }
    }

    if (revenueDelta !== 0) {
      await dashboardSummaryRepository.upsertIncrement({
        metricCode: 'finance.posted-revenue',
        branchId: payload.branchId,
        value: revenueDelta,
        currency: 'IDR',
        dataAsOf: new Date(),
        definitionVersion: DEFINITION_VERSION,
      });
    }
    if (expenseDelta !== 0) {
      await dashboardSummaryRepository.upsertIncrement({
        metricCode: 'finance.posted-expense',
        branchId: payload.branchId,
        value: expenseDelta,
        currency: 'IDR',
        dataAsOf: new Date(),
        definitionVersion: DEFINITION_VERSION,
      });
    }
  };

  eventBus.subscribe<JournalPostedLikePayload>('finance.journal.posted.v1', async (payload) => {
    await applyJournalRevenueExpenseDelta('reports.finance.journal-posted', payload);
  });

  eventBus.subscribe<{ reversalJournalId: string; branchId: string }>('finance.journal.reversed.v1', async (payload) => {
    // The reversal journal's own lines are already the mirror-image of the original, so applying
    // them the same way (increment) naturally nets the accumulated revenue/expense back out.
    await applyJournalRevenueExpenseDelta('reports.finance.journal-reversed', {
      journalId: payload.reversalJournalId,
      branchId: payload.branchId,
    });
  });

  const QUEUE_STATUSES = ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'SKIPPED'];

  const refreshQueueGauge = async (checkpointKey: string, payload: QueueEventPayload) => {
    if (!(await checkpointRepository.claim(checkpointKey, `${payload.queueId}:${payload.event}`))) return;
    const counts = await queueRepository.countByStatus({ branchId: payload.branchId });
    // Iterate the full status list, not just Object.entries(counts) -- a status with zero
    // queues right now must still overwrite its gauge back to 0, not leave a stale nonzero value.
    for (const status of QUEUE_STATUSES) {
      await dashboardSummaryRepository.upsertSet({
        metricCode: `queue.count.${status}`,
        branchId: payload.branchId,
        value: counts[status] ?? 0,
        dataAsOf: new Date(),
        definitionVersion: DEFINITION_VERSION,
      });
    }
  };

  eventBus.subscribe<QueueEventPayload>(QUEUE_CREATED_EVENT, async (payload) => {
    await refreshQueueGauge('reports.queue.created', payload);
  });
  eventBus.subscribe<QueueEventPayload>(QUEUE_CALLED_EVENT, async (payload) => {
    await refreshQueueGauge('reports.queue.called', payload);
  });
  eventBus.subscribe<QueueEventPayload>(QUEUE_COMPLETED_EVENT, async (payload) => {
    await refreshQueueGauge('reports.queue.completed', payload);
  });

  const refreshLowStockGauge = async (checkpointKey: string, sourceKey: string, warehouseId: string) => {
    if (!(await checkpointRepository.claim(checkpointKey, sourceKey))) return;
    const location = await warehouseLocationRepository.findById(warehouseId);
    if (!location) return;

    const { items: stocks } = await stockRepository.list({ page: 1, limit: 1000, sort: 'createdAt', order: 'desc' }, { warehouseId });
    let lowStockCount = 0;
    for (const stock of stocks) {
      const item = await itemRepository.findById(stock.itemId);
      const minimumStock = stock.minimumStock !== null ? Number(stock.minimumStock) : (item ? Number(item.minimumStock) : 0);
      if (Number(stock.availableStock) <= minimumStock) {
        lowStockCount += 1;
      }
    }

    await dashboardSummaryRepository.upsertSet({
      metricCode: 'warehouse.low-stock.count',
      branchId: location.branchId,
      value: lowStockCount,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });
  };

  eventBus.subscribe<{ goodsReceiptId: string; warehouseId: string }>('warehouse.goods-receipt.posted.v1', async (payload) => {
    await refreshLowStockGauge('reports.warehouse.goods-receipt', payload.goodsReceiptId, payload.warehouseId);
  });
  eventBus.subscribe<{ adjustmentId: string; warehouseId: string }>('warehouse.stock-adjusted.v1', async (payload) => {
    await refreshLowStockGauge('reports.warehouse.stock-adjusted', payload.adjustmentId, payload.warehouseId);
  });
  eventBus.subscribe<{ opnameId: string; warehouseId: string }>('warehouse.stock-opname-approved.v1', async (payload) => {
    await refreshLowStockGauge('reports.warehouse.stock-opname', payload.opnameId, payload.warehouseId);
  });
}
