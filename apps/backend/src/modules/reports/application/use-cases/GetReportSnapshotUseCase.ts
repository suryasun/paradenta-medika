import { ReportSnapshot } from '@prisma/client';
import { IReportSnapshotRepository } from '../../domain/repositories/IReportSnapshotRepository';
import { computePayloadHash } from '../services/ReportChecksum';
import { ReportSnapshotNotFoundException, ReportSnapshotTamperedException } from '../../domain/exceptions/ReportExceptions';

/** docs/06-tasks/task-190.md: verifies checksum/integrity before returning (TC-RPT-015). */
export class GetReportSnapshotUseCase {
  constructor(private readonly reportSnapshotRepository: IReportSnapshotRepository) {}

  async execute(snapshotId: string): Promise<ReportSnapshot> {
    const snapshot = await this.reportSnapshotRepository.findById(snapshotId);
    if (!snapshot) {
      throw new ReportSnapshotNotFoundException();
    }
    const recomputed = computePayloadHash(snapshot.payload);
    if (recomputed !== snapshot.payloadHash) {
      throw new ReportSnapshotTamperedException();
    }
    return snapshot;
  }
}
