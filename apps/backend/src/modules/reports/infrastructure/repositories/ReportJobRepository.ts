import { Prisma, ReportJob, ReportJobStatus } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateReportJobInput, IReportJobRepository } from '../../domain/repositories/IReportJobRepository';

export class ReportJobRepository implements IReportJobRepository {
  async create(input: CreateReportJobInput): Promise<ReportJob> {
    return prisma.reportJob.create({
      data: {
        reportName: input.reportName,
        requestedBy: input.requestedBy,
        branchScope: input.branchScope as Prisma.InputJsonValue,
        parameters: input.parameters as Prisma.InputJsonValue,
        idempotencyKey: input.idempotencyKey,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<ReportJob | null> {
    return prisma.reportJob.findUnique({ where: { id } });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ReportJob | null> {
    return prisma.reportJob.findUnique({ where: { idempotencyKey } });
  }

  async markStatus(
    id: string,
    status: ReportJobStatus,
    fields?: { startedAt?: Date; finishedAt?: Date; errorCode?: string; errorMessage?: string },
  ): Promise<ReportJob> {
    return prisma.reportJob.update({
      where: { id },
      data: {
        status,
        startedAt: fields?.startedAt,
        finishedAt: fields?.finishedAt,
        errorCode: fields?.errorCode,
        errorMessage: fields?.errorMessage,
      },
    });
  }
}
