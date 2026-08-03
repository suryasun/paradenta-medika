import { QueueDashboardUseCase } from '../../../queue/application/use-cases/QueueDashboardUseCase';
import { GetTrialBalanceReportUseCase } from '../../../finance/application/use-cases/GetTrialBalanceReportUseCase';
import { GetIncomeStatementReportUseCase } from '../../../finance/application/use-cases/GetIncomeStatementReportUseCase';
import { GetStockCardReportUseCase } from '../../../warehouse/application/use-cases/GetStockCardReportUseCase';
import { GetExpiryReportUseCase } from '../../../warehouse/application/use-cases/GetExpiryReportUseCase';
import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { CLINICAL_DASHBOARD_METRICS } from '../services/MetricDefinitions';
import { findReportDefinition } from '../services/ReportCatalog';
import {
  ReportDatasetUnavailableException,
  ReportDefinitionNotFoundException,
  ReportFilterInvalidException,
  ReportRangeTooLargeException,
  ReportScopeForbiddenException,
} from '../../domain/exceptions/ReportExceptions';

const BILLING_REPORT_METRICS = ['billing.collection', 'billing.outstanding'];
const BILLING_GLOBAL_METRICS = ['billing.collection'];
const RESERVATION_GLOBAL_METRICS = ['reservation.created.count', 'reservation.cancelled.count'];

const MAX_SYNC_RANGE_DAYS = 90;

export interface ReportQueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  order?: string;
  branchId?: string;
  periodId?: string;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  warehouseId?: string;
  itemId?: string;
  status?: string;
  expiryFrom?: string;
  expiryTo?: string;
}

function defaultListQuery(query: ReportQueryParams) {
  return {
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 20,
    sort: query.sort ?? 'createdAt',
    order: (query.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
  };
}

/**
 * docs/06-tasks/task-186.md: `GetReportUseCase` -- a thin dispatcher over
 * this codebase's already-built report/aggregation use cases, per report
 * code (Section 6.3 catalog), rather than a second implementation of the
 * same report logic. Filters/date-range are validated server-side and
 * rejected (RPT_FILTER_INVALID / RPT_RANGE_TOO_LARGE), never silently
 * widened, per Section 6.2's own text.
 */
export class GetReportUseCase {
  constructor(
    private readonly queueDashboardUseCase: QueueDashboardUseCase,
    private readonly dashboardMetricAssembler: DashboardMetricAssembler,
    private readonly getTrialBalanceReportUseCase: GetTrialBalanceReportUseCase,
    private readonly getIncomeStatementReportUseCase: GetIncomeStatementReportUseCase,
    private readonly getStockCardReportUseCase: GetStockCardReportUseCase,
    private readonly getExpiryReportUseCase: GetExpiryReportUseCase,
  ) {}

  /**
   * Request-shape validation only (definition exists, requester is
   * permitted, range isn't oversized) -- separated from `execute` so
   * `CreateReportJobUseCase` (task-187) can validate the request BEFORE
   * creating a report_jobs row, and only treat failures that happen
   * during actual dispatch (e.g. RPT_DATASET_UNAVAILABLE) as a job
   * execution failure rather than a rejected request.
   */
  validate(reportCode: string, query: ReportQueryParams, requesterPermissions: string[]) {
    const definition = findReportDefinition(reportCode);
    if (!definition) {
      throw new ReportDefinitionNotFoundException();
    }
    if (!requesterPermissions.includes(definition.permission)) {
      throw new ReportScopeForbiddenException();
    }
    this.assertRangeNotTooLarge(query);
    return definition;
  }

  async execute(reportCode: string, query: ReportQueryParams, requesterPermissions: string[]): Promise<unknown> {
    const definition = this.validate(reportCode, query, requesterPermissions);

    if (!definition.implemented) {
      throw new ReportDatasetUnavailableException(`${definition.name} has no backing data source in this deployment yet`);
    }

    switch (reportCode) {
      case 'operations.queue-performance':
        return this.getOperationsReport(query);
      case 'clinical.visit-summary':
        return this.dashboardMetricAssembler.assemble(CLINICAL_DASHBOARD_METRICS, [], query.branchId);
      case 'billing.daily-summary':
        return this.dashboardMetricAssembler.assemble(BILLING_REPORT_METRICS, BILLING_GLOBAL_METRICS, query.branchId);
      case 'finance.trial-balance':
        this.requireBranchId(query);
        return this.getTrialBalanceReportUseCase.execute({ ...defaultListQuery(query), branchId: query.branchId!, periodId: query.periodId, dateFrom: query.dateFrom, dateTo: query.dateTo });
      case 'finance.income-statement':
        this.requireBranchId(query);
        return this.getIncomeStatementReportUseCase.execute({ ...defaultListQuery(query), branchId: query.branchId!, periodId: query.periodId, dateFrom: query.dateFrom, dateTo: query.dateTo });
      case 'inventory.stock-card':
        if (!query.warehouseId || !query.itemId) {
          throw new ReportFilterInvalidException('inventory.stock-card requires both warehouseId and itemId');
        }
        return this.getStockCardReportUseCase.execute({
          ...defaultListQuery(query),
          warehouseId: query.warehouseId,
          itemId: query.itemId,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        });
      case 'inventory.expiry':
        return this.getExpiryReportUseCase.execute({
          ...defaultListQuery(query),
          itemId: query.itemId,
          warehouseId: query.warehouseId,
          status: query.status as never,
          expiryFrom: query.expiryFrom,
          expiryTo: query.expiryTo,
        });
      default:
        // Unreachable: every REPORT_CATALOG entry is handled above or by the `implemented` guard.
        throw new ReportDatasetUnavailableException();
    }
  }

  private async getOperationsReport(query: ReportQueryParams) {
    const [queueMetrics, reservationMetrics] = await Promise.all([
      this.queueDashboardUseCase.execute(query.branchId),
      this.dashboardMetricAssembler.assemble(RESERVATION_GLOBAL_METRICS, RESERVATION_GLOBAL_METRICS, query.branchId),
    ]);
    return {
      scope: reservationMetrics.scope,
      dataAsOf: reservationMetrics.dataAsOf,
      freshness: reservationMetrics.freshness,
      definitionVersion: reservationMetrics.definitionVersion,
      queue: queueMetrics,
      metrics: reservationMetrics.metrics,
    };
  }

  private requireBranchId(query: ReportQueryParams): void {
    if (!query.branchId) {
      throw new ReportFilterInvalidException('branchId is required for this report');
    }
  }

  private assertRangeNotTooLarge(query: ReportQueryParams): void {
    if (!query.dateFrom || !query.dateTo) {
      return;
    }
    const from = new Date(query.dateFrom);
    const to = new Date(query.dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new ReportFilterInvalidException('dateFrom/dateTo must be valid dates');
    }
    const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (days > MAX_SYNC_RANGE_DAYS) {
      throw new ReportRangeTooLargeException();
    }
  }
}
