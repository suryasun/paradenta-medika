import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IObjectStorageService } from '../../../../shared/storage/IObjectStorageService';
import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { DownloadAttachmentResponseDto } from '../dtos/AttachmentResponseDto';

export interface DownloadAttachmentInput {
  attachmentId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-080.md: "generate a short-lived, secure/signed URL...
 * rather than proxying the full binary through the API server." TTL isn't
 * specified in the SAD -- 300 seconds (5 minutes) is a conservative
 * default, a flagged configuration decision, not a documented value.
 * Every call is audit-logged since attachment access is clinically/legally
 * sensitive.
 */
const SIGNED_URL_TTL_SECONDS = 300;

export class DownloadAttachmentUseCase {
  constructor(
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly objectStorage: IObjectStorageService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: DownloadAttachmentInput): Promise<DownloadAttachmentResponseDto> {
    const attachment = await this.attachmentRepository.findById(input.attachmentId);
    if (!attachment || !attachment.currentVersion) {
      throw new AttachmentNotFoundException();
    }

    const token = this.objectStorage.getSignedUrl(
      attachment.currentVersion.bucket,
      attachment.currentVersion.objectKey,
      SIGNED_URL_TTL_SECONDS,
    );

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Attachment',
      attachment.id,
      'READ',
      null,
      { action: 'download', versionNumber: attachment.currentVersion.versionNumber },
      auditContext,
    );

    return { url: `/api/v1/attachments/file/${token}`, expiresInSeconds: SIGNED_URL_TTL_SECONDS };
  }
}
