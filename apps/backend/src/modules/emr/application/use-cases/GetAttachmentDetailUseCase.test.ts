import { GetAttachmentDetailUseCase } from './GetAttachmentDetailUseCase';
import { FakeAttachmentAnnotationRepository, FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';
import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';

describe('GetAttachmentDetailUseCase (task-079)', () => {
  it('rejects a non-existent attachment', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const annotationRepository = new FakeAttachmentAnnotationRepository();
    const useCase = new GetAttachmentDetailUseCase(attachmentRepository, annotationRepository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(AttachmentNotFoundException);
  });

  it('returns detail matching the uploaded metadata exactly', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const annotationRepository = new FakeAttachmentAnnotationRepository();
    const attachment = await attachmentRepository.createWithFirstVersion({
      visitId: 'v1',
      patientId: 'p1',
      category: 'X_RAY' as never,
      attachmentType: 'Periapical',
      file: {
        fileName: 'xray.jpg',
        storedName: 'stored-xray.jpg',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        bucket: 'parakita-attachments',
        objectKey: 'patient/p1/visit/v1/x_ray/stored-xray.jpg',
        checksum: 'abc123',
      },
      createdBy: 'doc-1',
    });

    const useCase = new GetAttachmentDetailUseCase(attachmentRepository, annotationRepository);
    const detail = await useCase.execute(attachment.id);

    expect(detail.category).toBe('X_RAY');
    expect(detail.attachmentType).toBe('Periapical');
    expect(detail.currentVersion?.fileName).toBe('xray.jpg');
    expect(detail.currentVersion?.checksum).toBe('abc123');
    expect(detail.annotations).toEqual([]);
  });
});
