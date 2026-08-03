import {
  DashboardMetricRow,
  IDashboardSummaryRepository,
  UpsertMetricInput,
} from '../../src/modules/reports/domain/repositories/IDashboardSummaryRepository';
import { IProjectionCheckpointRepository } from '../../src/modules/reports/domain/repositories/IProjectionCheckpointRepository';

export class FakeDashboardSummaryRepository implements IDashboardSummaryRepository {
  rows: DashboardMetricRow[] = [];

  private find(metricCode: string, branchId: string | null, dimensionKey: string) {
    return this.rows.find((r) => r.metricCode === metricCode && r.branchId === branchId && r.dimensionKey === dimensionKey);
  }

  async upsertIncrement(input: UpsertMetricInput): Promise<void> {
    const dimensionKey = input.dimensionKey ?? '';
    const existing = this.find(input.metricCode, input.branchId, dimensionKey);
    if (existing) {
      existing.value += input.value;
      existing.dataAsOf = input.dataAsOf;
      existing.definitionVersion = input.definitionVersion;
      if (input.currency) existing.currency = input.currency;
      return;
    }
    this.rows.push({
      metricCode: input.metricCode,
      branchId: input.branchId,
      dimensionKey,
      value: input.value,
      currency: input.currency ?? null,
      dataAsOf: input.dataAsOf,
      definitionVersion: input.definitionVersion,
    });
  }

  async upsertSet(input: UpsertMetricInput): Promise<void> {
    const dimensionKey = input.dimensionKey ?? '';
    const existing = this.find(input.metricCode, input.branchId, dimensionKey);
    if (existing) {
      existing.value = input.value;
      existing.dataAsOf = input.dataAsOf;
      existing.definitionVersion = input.definitionVersion;
      if (input.currency) existing.currency = input.currency;
      return;
    }
    this.rows.push({
      metricCode: input.metricCode,
      branchId: input.branchId,
      dimensionKey,
      value: input.value,
      currency: input.currency ?? null,
      dataAsOf: input.dataAsOf,
      definitionVersion: input.definitionVersion,
    });
  }

  async listByCodes(metricCodes: string[], branchId?: string | null): Promise<DashboardMetricRow[]> {
    return this.rows.filter((r) => metricCodes.includes(r.metricCode) && (branchId === undefined || r.branchId === branchId));
  }
}

export class FakeProjectionCheckpointRepository implements IProjectionCheckpointRepository {
  claimed = new Set<string>();

  async claim(consumerName: string, sourceKey: string): Promise<boolean> {
    const key = `${consumerName}::${sourceKey}`;
    if (this.claimed.has(key)) return false;
    this.claimed.add(key);
    return true;
  }
}
