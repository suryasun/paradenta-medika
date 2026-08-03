import { Prisma, ReportSnapshot } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateReportSnapshotInput, IReportSnapshotRepository } from '../../domain/repositories/IReportSnapshotRepository';

export class ReportSnapshotRepository implements IReportSnapshotRepository {
  async create(input: CreateReportSnapshotInput): Promise<ReportSnapshot> {
    return prisma.reportSnapshot.create({
      data: {
        reportJobId: input.reportJobId,
        snapshotDate: input.snapshotDate,
        module: input.module,
        definitionVersion: input.definitionVersion,
        sourceWatermark: input.sourceWatermark,
        scopeHash: input.scopeHash,
        payload: input.payload as Prisma.InputJsonValue,
        payloadHash: input.payloadHash,
        rowCount: input.rowCount,
        schemaVersion: input.schemaVersion,
        retentionUntil: input.retentionUntil,
      },
    });
  }

  async findById(id: string): Promise<ReportSnapshot | null> {
    return prisma.reportSnapshot.findUnique({ where: { id } });
  }
}
