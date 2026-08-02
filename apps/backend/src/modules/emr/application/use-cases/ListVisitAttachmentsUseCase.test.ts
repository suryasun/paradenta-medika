import { ListVisitAttachmentsUseCase } from './ListVisitAttachmentsUseCase';
import { FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';

function fileInput(name: string) {
  return {
    fileName: name,
    storedName: `stored-${name}`,
    extension: 'jpg',
    mimeType: 'image/jpeg',
    fileSize: 100,
    bucket: 'parakita-attachments',
    objectKey: `patient/p1/visit/v1/photo/stored-${name}`,
    checksum: 'checksum',
  };
}

describe('ListVisitAttachmentsUseCase (task-082)', () => {
  it('returns all attachments for the visit, excluding archived ones by default', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const active = await attachmentRepository.createWithFirstVersion({
      visitId: 'v1',
      patientId: 'p1',
      category: 'CLINICAL_PHOTOGRAPHY' as never,
      file: fileInput('a.jpg'),
      createdBy: 'doc-1',
    });
    const archived = await attachmentRepository.createWithFirstVersion({
      visitId: 'v1',
      patientId: 'p1',
      category: 'CLINICAL_PHOTOGRAPHY' as never,
      file: fileInput('b.jpg'),
      createdBy: 'doc-1',
    });
    await attachmentRepository.archive(archived.id, 'doc-1');
    await attachmentRepository.createWithFirstVersion({
      visitId: 'other-visit',
      patientId: 'p2',
      category: 'CLINICAL_PHOTOGRAPHY' as never,
      file: fileInput('c.jpg'),
      createdBy: 'doc-1',
    });

    const useCase = new ListVisitAttachmentsUseCase(attachmentRepository);
    const result = await useCase.execute('v1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(active.id);
  });
});
