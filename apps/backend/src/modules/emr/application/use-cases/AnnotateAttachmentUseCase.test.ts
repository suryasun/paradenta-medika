import { AnnotateAttachmentUseCase } from './AnnotateAttachmentUseCase';
import { FakeAttachmentAnnotationRepository, FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { AnnotationNotSupportedException } from '../../domain/exceptions/EmrExceptions';

async function seedAttachment(repo: FakeAttachmentRepository, category: string) {
  return repo.createWithFirstVersion({
    visitId: 'v1',
    patientId: 'p1',
    category: category as never,
    file: {
      fileName: 'photo.jpg',
      storedName: 'stored-photo.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      fileSize: 512,
      bucket: 'parakita-attachments',
      objectKey: 'patient/p1/visit/v1/clinical_photography/stored-photo.jpg',
      checksum: 'checksum-1',
    },
    createdBy: 'doc-1',
  });
}

describe('AnnotateAttachmentUseCase (task-081)', () => {
  it('rejects annotation for a category that does not support it (e.g. PDF)', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const annotationRepository = new FakeAttachmentAnnotationRepository();
    const auditService = new FakeAuditService();
    const attachment = await seedAttachment(attachmentRepository, 'PDF');
    const useCase = new AnnotateAttachmentUseCase(attachmentRepository, annotationRepository, auditService);

    await expect(
      useCase.execute({ attachmentId: attachment.id, shape: 'circle', positionX: 10, positionY: 10, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(AnnotationNotSupportedException);
  });

  it('persists an annotation without altering the original file version metadata', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const annotationRepository = new FakeAttachmentAnnotationRepository();
    const auditService = new FakeAuditService();
    const attachment = await seedAttachment(attachmentRepository, 'X_RAY');
    const useCase = new AnnotateAttachmentUseCase(attachmentRepository, annotationRepository, auditService);

    const annotation = await useCase.execute({
      attachmentId: attachment.id,
      shape: 'circle',
      positionX: 25,
      positionY: 40,
      text: 'Possible lesion',
      actorUserId: 'doc-1',
    });

    expect(annotation.shape).toBe('circle');
    expect(annotation.text).toBe('Possible lesion');

    const reloaded = await attachmentRepository.findById(attachment.id);
    expect(reloaded?.currentVersion?.checksum).toBe('checksum-1');
    expect(reloaded?.currentVersion?.fileName).toBe('photo.jpg');
  });
});
