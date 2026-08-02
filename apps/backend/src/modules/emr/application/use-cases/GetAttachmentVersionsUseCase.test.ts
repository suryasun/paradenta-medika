import { GetAttachmentVersionsUseCase } from './GetAttachmentVersionsUseCase';
import { FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';
import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';

describe('GetAttachmentVersionsUseCase (task-084 frontend support)', () => {
  it('rejects a non-existent attachment', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const useCase = new GetAttachmentVersionsUseCase(attachmentRepository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(AttachmentNotFoundException);
  });

  it('returns every version in order', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const attachment = await attachmentRepository.createWithFirstVersion({
      visitId: 'v1',
      patientId: 'p1',
      category: 'X_RAY' as never,
      file: {
        fileName: 'v1.jpg',
        storedName: 'stored-v1.jpg',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        fileSize: 100,
        bucket: 'parakita-attachments',
        objectKey: 'key-v1',
        checksum: 'c1',
      },
      createdBy: 'doc-1',
    });
    await attachmentRepository.addVersion({
      attachmentId: attachment.id,
      file: {
        fileName: 'v2.jpg',
        storedName: 'stored-v2.jpg',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        fileSize: 110,
        bucket: 'parakita-attachments',
        objectKey: 'key-v2',
        checksum: 'c2',
      },
      createdBy: 'doc-1',
    });

    const useCase = new GetAttachmentVersionsUseCase(attachmentRepository);
    const versions = await useCase.execute(attachment.id);

    expect(versions.map((v) => v.versionNumber)).toEqual([1, 2]);
  });
});
