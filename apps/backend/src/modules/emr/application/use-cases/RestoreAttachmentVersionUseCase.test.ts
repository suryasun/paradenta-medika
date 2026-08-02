import { RestoreAttachmentVersionUseCase } from './RestoreAttachmentVersionUseCase';
import { FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { AttachmentVersionNotFoundException } from '../../domain/exceptions/EmrExceptions';

async function seedAttachmentWithTwoVersions(repo: FakeAttachmentRepository) {
  const attachment = await repo.createWithFirstVersion({
    visitId: 'v1',
    patientId: 'p1',
    category: 'X_RAY' as never,
    file: {
      fileName: 'xray-v1.jpg',
      storedName: 'stored-v1.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      fileSize: 100,
      bucket: 'parakita-attachments',
      objectKey: 'patient/p1/visit/v1/x_ray/stored-v1.jpg',
      checksum: 'checksum-v1',
    },
    createdBy: 'doc-1',
  });
  await repo.addVersion({
    attachmentId: attachment.id,
    file: {
      fileName: 'xray-v2.jpg',
      storedName: 'stored-v2.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      fileSize: 110,
      bucket: 'parakita-attachments',
      objectKey: 'patient/p1/visit/v1/x_ray/stored-v2.jpg',
      checksum: 'checksum-v2',
    },
    createdBy: 'doc-1',
  });
  return attachment;
}

describe('RestoreAttachmentVersionUseCase (task-084)', () => {
  it('rejects restoring a non-existent version', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const auditService = new FakeAuditService();
    const attachment = await seedAttachmentWithTwoVersions(attachmentRepository);
    const useCase = new RestoreAttachmentVersionUseCase(attachmentRepository, auditService);

    await expect(
      useCase.execute({ attachmentId: attachment.id, versionNumber: 99, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(AttachmentVersionNotFoundException);
  });

  it('updates the current pointer to an older version without deleting any version history', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const auditService = new FakeAuditService();
    const attachment = await seedAttachmentWithTwoVersions(attachmentRepository);
    const useCase = new RestoreAttachmentVersionUseCase(attachmentRepository, auditService);

    const restored = await useCase.execute({ attachmentId: attachment.id, versionNumber: 1, actorUserId: 'doc-1' });

    expect(restored.currentVersion?.versionNumber).toBe(1);
    expect(restored.currentVersion?.fileName).toBe('xray-v1.jpg');

    const allVersions = await attachmentRepository.findVersions(attachment.id);
    expect(allVersions).toHaveLength(2);
  });
});
