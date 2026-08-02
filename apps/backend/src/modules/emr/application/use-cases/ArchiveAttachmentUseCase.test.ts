import { ArchiveAttachmentUseCase } from './ArchiveAttachmentUseCase';
import { ListVisitAttachmentsUseCase } from './ListVisitAttachmentsUseCase';
import { GetAttachmentDetailUseCase } from './GetAttachmentDetailUseCase';
import { FakeAttachmentAnnotationRepository, FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

describe('ArchiveAttachmentUseCase (task-083)', () => {
  it('excludes the attachment from the active list but keeps it directly retrievable by id', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const annotationRepository = new FakeAttachmentAnnotationRepository();
    const auditService = new FakeAuditService();
    const attachment = await attachmentRepository.createWithFirstVersion({
      visitId: 'v1',
      patientId: 'p1',
      category: 'PDF' as never,
      file: {
        fileName: 'doc.pdf',
        storedName: 'stored-doc.pdf',
        extension: 'pdf',
        mimeType: 'application/pdf',
        fileSize: 100,
        bucket: 'parakita-attachments',
        objectKey: 'patient/p1/visit/v1/pdf/stored-doc.pdf',
        checksum: 'checksum',
      },
      createdBy: 'doc-1',
    });

    const archiveUseCase = new ArchiveAttachmentUseCase(attachmentRepository, auditService);
    await archiveUseCase.execute({ attachmentId: attachment.id, actorUserId: 'doc-1' });

    const listUseCase = new ListVisitAttachmentsUseCase(attachmentRepository);
    expect(await listUseCase.execute('v1')).toHaveLength(0);

    const detailUseCase = new GetAttachmentDetailUseCase(attachmentRepository, annotationRepository);
    const detail = await detailUseCase.execute(attachment.id);
    expect(detail.id).toBe(attachment.id);
    expect(detail.archivedAt).not.toBeNull();
  });
});
