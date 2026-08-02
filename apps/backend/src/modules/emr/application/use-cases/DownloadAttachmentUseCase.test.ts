import { DownloadAttachmentUseCase } from './DownloadAttachmentUseCase';
import { FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeObjectStorageService } from '../../../../../tests/fakes/storageFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';

async function seedAttachment(repo: FakeAttachmentRepository) {
  return repo.createWithFirstVersion({
    visitId: 'v1',
    patientId: 'p1',
    category: 'PDF' as never,
    file: {
      fileName: 'consent.pdf',
      storedName: 'stored-consent.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 2048,
      bucket: 'parakita-attachments',
      objectKey: 'patient/p1/visit/v1/pdf/stored-consent.pdf',
      checksum: 'def456',
    },
    createdBy: 'doc-1',
  });
}

describe('DownloadAttachmentUseCase (task-080)', () => {
  it('rejects a non-existent attachment', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const objectStorage = new FakeObjectStorageService();
    const auditService = new FakeAuditService();
    const useCase = new DownloadAttachmentUseCase(attachmentRepository, objectStorage, auditService);

    await expect(useCase.execute({ attachmentId: 'missing', actorUserId: 'doc-1' })).rejects.toBeInstanceOf(AttachmentNotFoundException);
  });

  it('generates a working signed URL that expires as configured, and logs the access to the Audit Trail', async () => {
    const attachmentRepository = new FakeAttachmentRepository();
    const objectStorage = new FakeObjectStorageService();
    const auditService = new FakeAuditService();
    const attachment = await seedAttachment(attachmentRepository);
    const useCase = new DownloadAttachmentUseCase(attachmentRepository, objectStorage, auditService);

    const result = await useCase.execute({ attachmentId: attachment.id, actorUserId: 'doc-1' });

    expect(result.expiresInSeconds).toBeGreaterThan(0);
    const token = result.url.split('/').pop()!;
    expect(() => objectStorage.verifySignedToken(token)).not.toThrow();

    // Simulate expiry.
    const entry = objectStorage.signedUrls.get(token)!;
    entry.expiresAt = Date.now() - 1000;
    expect(() => objectStorage.verifySignedToken(token)).toThrow();

    expect(auditService.records).toHaveLength(1);
    expect(auditService.records[0].entity).toBe('Attachment');
    expect(auditService.records[0].action).toBe('READ');
  });
});
