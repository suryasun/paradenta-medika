import { ReportJob, ReportJobStatus } from '@prisma/client';

export interface CreateReportJobInput {
  reportName: string;
  requestedBy: string;
  branchScope: unknown;
  parameters: unknown;
  idempotencyKey: string;
}

export interface IReportJobRepository {
  create(input: CreateReportJobInput): Promise<ReportJob>;
  findById(id: string): Promise<ReportJob | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<ReportJob | null>;
  markStatus(
    id: string,
    status: ReportJobStatus,
    fields?: { startedAt?: Date; finishedAt?: Date; errorCode?: string; errorMessage?: string },
  ): Promise<ReportJob>;
}
