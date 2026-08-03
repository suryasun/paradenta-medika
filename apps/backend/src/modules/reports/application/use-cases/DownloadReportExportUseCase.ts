import { ExportArtifact } from '@prisma/client';
import { IExportArtifactRepository } from '../../domain/repositories/IExportArtifactRepository';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ReportExportArtifactNotFoundException, ReportExportExpiredException } from '../../domain/exceptions/ReportExceptions';

/** docs/06-tasks/task-191.md: retention expiry (TC-RPT-013) + audit trail (TC-RPT-018). Export sanitisation itself already happened at artifact-creation time (see CreateReportJobUseCase/ReportCsvFormatter.ts, TC-RPT-014). */
export class DownloadReportExportUseCase {
  constructor(
    private readonly exportArtifactRepository: IExportArtifactRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(artifactId: string, auditContext: AuditContext): Promise<ExportArtifact> {
    const artifact = await this.exportArtifactRepository.findById(artifactId);
    if (!artifact) {
      throw new ReportExportArtifactNotFoundException();
    }

    if (artifact.retentionUntil.getTime() < Date.now()) {
      await this.auditService.record(
        'ExportArtifact',
        artifactId,
        'READ',
        null,
        { outcome: 'EXPIRED' },
        auditContext,
      );
      throw new ReportExportExpiredException();
    }

    const downloaded = await this.exportArtifactRepository.markDownloaded(artifactId, new Date());
    await this.auditService.record(
      'ExportArtifact',
      artifactId,
      'READ',
      null,
      { outcome: 'DOWNLOADED', format: artifact.format, filename: artifact.filename },
      auditContext,
    );
    return downloaded;
  }
}
