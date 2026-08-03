import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  DashboardMetricRow,
  IDashboardSummaryRepository,
  UpsertMetricInput,
} from '../../domain/repositories/IDashboardSummaryRepository';

export class DashboardSummaryRepository implements IDashboardSummaryRepository {
  /**
   * Not a Prisma compound-unique `upsert()`: MySQL treats NULL as distinct
   * in a unique index, so a (metricCode, branchId, dimensionKey) DB
   * constraint alone would not catch two global-scope (branchId=null) rows
   * for the same metric -- the same documented gap as Account's
   * (branchId, code) constraint. This does the existence check at the
   * application level instead, and passes `undefined` (never a bare
   * `null`) into `.where`, since Prisma's compound-unique input type does
   * not accept `null` for a nullable field either.
   */
  private async findExisting(metricCode: string, branchId: string | null, dimensionKey: string) {
    return prisma.dashboardSummary.findFirst({ where: { metricCode, branchId, dimensionKey } });
  }

  async upsertIncrement(input: UpsertMetricInput): Promise<void> {
    const dimensionKey = input.dimensionKey ?? '';
    const existing = await this.findExisting(input.metricCode, input.branchId, dimensionKey);
    if (existing) {
      await prisma.dashboardSummary.update({
        where: { id: existing.id },
        data: { value: { increment: input.value }, currency: input.currency, dataAsOf: input.dataAsOf, definitionVersion: input.definitionVersion },
      });
      return;
    }
    await prisma.dashboardSummary.create({
      data: {
        metricCode: input.metricCode,
        branchId: input.branchId,
        dimensionKey,
        value: input.value,
        currency: input.currency,
        dataAsOf: input.dataAsOf,
        definitionVersion: input.definitionVersion,
      },
    });
  }

  async upsertSet(input: UpsertMetricInput): Promise<void> {
    const dimensionKey = input.dimensionKey ?? '';
    const existing = await this.findExisting(input.metricCode, input.branchId, dimensionKey);
    if (existing) {
      await prisma.dashboardSummary.update({
        where: { id: existing.id },
        data: { value: input.value, currency: input.currency, dataAsOf: input.dataAsOf, definitionVersion: input.definitionVersion },
      });
      return;
    }
    await prisma.dashboardSummary.create({
      data: {
        metricCode: input.metricCode,
        branchId: input.branchId,
        dimensionKey,
        value: input.value,
        currency: input.currency,
        dataAsOf: input.dataAsOf,
        definitionVersion: input.definitionVersion,
      },
    });
  }

  async listByCodes(metricCodes: string[], branchId?: string | null): Promise<DashboardMetricRow[]> {
    const rows = await prisma.dashboardSummary.findMany({
      where: {
        metricCode: { in: metricCodes },
        branchId: branchId === undefined ? undefined : branchId,
      },
    });
    return rows.map((row) => ({
      metricCode: row.metricCode,
      branchId: row.branchId,
      dimensionKey: row.dimensionKey,
      value: Number(row.value),
      currency: row.currency,
      dataAsOf: row.dataAsOf,
      definitionVersion: row.definitionVersion,
    }));
  }
}
