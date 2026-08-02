import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ValidationException } from '../../../../shared/http/exceptions';
import { IObjectStorageService } from '../../../../shared/storage/IObjectStorageService';
import { AttachmentNotFoundException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { prepareUploadFile } from '../services/attachmentStorageKey';
import { AttachmentCategoryDto } from '../dtos/UploadAttachmentRequestDto';
import { AttachmentResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentResponseDto } from '../mappers/AttachmentMapper';

export interface UploadAttachmentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadAttachmentInput {
  visitId: string;
  patientId: string;
  category: AttachmentCategoryDto;
  attachmentType?: string;
  attachmentId?: string;
  file: UploadAttachmentFile;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-078.md: "Attachments are Immutable and Versioned...
 * re-uploading a corrected file creates a new version, not an overwrite."
 * `attachmentId` presence in the input selects that path; its absence
 * creates a brand-new Attachment.
 */
export class UploadAttachmentUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly objectStorage: IObjectStorageService,
    private readonly bucket: string,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UploadAttachmentInput): Promise<AttachmentResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    if (input.patientId !== visit.patientId) {
      throw new ValidationException([{ field: 'patientId', message: 'patientId does not match the Visit' }]);
    }
    if (!input.file || input.file.size === 0) {
      throw new ValidationException([{ field: 'file', message: 'A file is required' }]);
    }

    const prepared = prepareUploadFile(input.patientId, input.visitId, input.category, input.file.originalname, input.file.buffer);
    const stored = await this.objectStorage.put(this.bucket, prepared.objectKey, input.file.buffer);

    const fileMetadata = {
      fileName: input.file.originalname,
      storedName: prepared.storedName,
      extension: prepared.extension,
      mimeType: input.file.mimetype,
      fileSize: stored.fileSize,
      bucket: stored.bucket,
      objectKey: stored.objectKey,
      checksum: prepared.checksum,
    };

    let attachment;
    if (input.attachmentId) {
      const existing = await this.attachmentRepository.findById(input.attachmentId);
      if (!existing || existing.visitId !== input.visitId) {
        throw new AttachmentNotFoundException();
      }
      attachment = await this.attachmentRepository.addVersion({
        attachmentId: input.attachmentId,
        file: fileMetadata,
        createdBy: input.actorUserId,
      });
    } else {
      attachment = await this.attachmentRepository.createWithFirstVersion({
        visitId: input.visitId,
        patientId: input.patientId,
        category: input.category,
        attachmentType: input.attachmentType,
        file: fileMetadata,
        createdBy: input.actorUserId,
      });
    }

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Attachment',
      attachment.id,
      input.attachmentId ? 'UPDATE' : 'CREATE',
      null,
      { category: input.category, fileName: fileMetadata.fileName, versionNumber: attachment.currentVersion?.versionNumber },
      auditContext,
    );

    return toAttachmentResponseDto(attachment);
  }
}
