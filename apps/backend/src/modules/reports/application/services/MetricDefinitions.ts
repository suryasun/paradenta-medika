/**
 * docs/03-sad/20-module-report.md Section 3.3 Metric Definition Standard.
 * A minimal in-code registry (not the "recommended supporting"
 * metric_definitions table from Section 5.1 -- that table is optional
 * infrastructure, deferred to keep this epic's scope bounded) covering
 * the metrics actually produced by this epic's event consumers.
 */
export const DEFINITION_VERSION = '1.0.0';

export interface MetricDefinition {
  code: string;
  name: string;
  ownerModule: string;
  grain: string;
  description: string;
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  'patient.new.count': {
    code: 'patient.new.count',
    name: 'New Patients',
    ownerModule: 'patient',
    grain: 'clinic (patients are not branch-scoped)',
    description: 'Cumulative count of PatientRegistered events since projection activation.',
  },
  'reservation.created.count': {
    code: 'reservation.created.count',
    name: 'Reservations Created',
    ownerModule: 'reservation',
    grain: 'clinic (ReservationCreated payload carries no branchId)',
    description: 'Cumulative count of ReservationCreated events since projection activation.',
  },
  'reservation.cancelled.count': {
    code: 'reservation.cancelled.count',
    name: 'Reservations Cancelled',
    ownerModule: 'reservation',
    grain: 'clinic (ReservationCancelled payload carries no branchId)',
    description: 'Cumulative count of ReservationCancelled events since projection activation.',
  },
  'emr.visit.completed.count': {
    code: 'emr.visit.completed.count',
    name: 'Visits Completed',
    ownerModule: 'emr',
    grain: 'branch',
    description: 'Cumulative count of EMRFinished events since projection activation.',
  },
  'billing.collection': {
    code: 'billing.collection',
    name: 'Collected Payments',
    ownerModule: 'billing',
    grain: 'clinic (PaymentCompleted payload carries no branchId)',
    description: 'Cumulative sum of PaymentCompleted amounts since projection activation. Not accounting revenue -- see finance.posted-revenue.',
  },
  'billing.outstanding': {
    code: 'billing.outstanding',
    name: 'Outstanding Balance',
    ownerModule: 'billing',
    grain: 'branch',
    description: 'Gauge recomputed on each PaymentCompleted event: sum of (grandTotal - paidAmount) across UNPAID/PARTIALLY_PAID invoices for the paid invoice\'s branch.',
  },
  'finance.posted-revenue': {
    code: 'finance.posted-revenue',
    name: 'Posted Revenue',
    ownerModule: 'finance',
    grain: 'branch',
    description: 'Cumulative sum of REVENUE-account credit-debit deltas from posted/reversed journals since projection activation.',
  },
  'finance.posted-expense': {
    code: 'finance.posted-expense',
    name: 'Posted Expense',
    ownerModule: 'finance',
    grain: 'branch',
    description: 'Cumulative sum of EXPENSE-account debit-credit deltas from posted/reversed journals since projection activation.',
  },
  'queue.count.WAITING': queueMetric('WAITING'),
  'queue.count.CALLED': queueMetric('CALLED'),
  'queue.count.IN_SERVICE': queueMetric('IN_SERVICE'),
  'queue.count.COMPLETED': queueMetric('COMPLETED'),
  'queue.count.CANCELLED': queueMetric('CANCELLED'),
  'queue.count.NO_SHOW': queueMetric('NO_SHOW'),
  'queue.count.SKIPPED': queueMetric('SKIPPED'),
  'warehouse.low-stock.count': {
    code: 'warehouse.low-stock.count',
    name: 'Low Stock Items',
    ownerModule: 'warehouse',
    grain: 'branch (resolved from warehouseId via WarehouseLocation.branchId)',
    description: 'Gauge recomputed on each warehouse posting event: count of items at or below minimum stock across the affected warehouse\'s branch.',
  },
};

function queueMetric(status: string): MetricDefinition {
  return {
    code: `queue.count.${status}`,
    name: `Queue Count (${status})`,
    ownerModule: 'queue',
    grain: 'branch',
    description: `Gauge recomputed from IQueueRepository.countByStatus whenever QueueCreated/QueueCalled/QueueCompleted fires. Eventual consistency note: transitions with no publishing event (Skip/Start/Cancel) only refresh on the next tracked event.`,
  };
}

export const EXECUTIVE_DASHBOARD_METRICS = [
  'patient.new.count',
  'reservation.created.count',
  'emr.visit.completed.count',
  'billing.collection',
  'billing.outstanding',
  'finance.posted-revenue',
  'finance.posted-expense',
  'warehouse.low-stock.count',
];

export const OPERATIONS_DASHBOARD_METRICS = [
  'reservation.created.count',
  'reservation.cancelled.count',
  'queue.count.WAITING',
  'queue.count.CALLED',
  'queue.count.IN_SERVICE',
  'queue.count.COMPLETED',
  'queue.count.CANCELLED',
  'queue.count.NO_SHOW',
  'queue.count.SKIPPED',
  'emr.visit.completed.count',
];

export const CLINICAL_DASHBOARD_METRICS = ['emr.visit.completed.count'];

export const FINANCE_DASHBOARD_METRICS = ['finance.posted-revenue', 'finance.posted-expense', 'billing.outstanding'];

export const WAREHOUSE_DASHBOARD_METRICS = ['warehouse.low-stock.count'];

export const BILLING_REPORT_METRICS = ['billing.collection', 'billing.outstanding'];
export const BILLING_GLOBAL_METRICS = ['billing.collection'];

/** docs/06-tasks/task-219.md: "the same metric set per branch side-by-side for comparison" -- a curated cross-domain set, not any one existing dashboard's own set. */
export const BRANCH_COMPARISON_METRICS = [
  'queue.count.WAITING',
  'queue.count.COMPLETED',
  'billing.collection',
  'billing.outstanding',
  'finance.posted-revenue',
];
export const BRANCH_COMPARISON_GLOBAL_METRICS: string[] = [];
