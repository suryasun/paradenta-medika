import { UploadAttachmentUseCase } from './UploadAttachmentUseCase';
import { FakeAttachmentRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeObjectStorageService } from '../../../../../tests/fakes/storageFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { AttachmentCategoryDto } from '../dtos/UploadAttachmentRequestDto';
import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

function buildFile(name = 'xray.jpg', content = 'fake-image-bytes') {
  return { originalname: name, mimetype: 'image/jpeg', size: Buffer.byteLength(content), buffer: Buffer.from(content) };
}

describe('UploadAttachmentUseCase (task-078)', () => {
  it.each([
    AttachmentCategoryDto.CLINICAL_PHOTOGRAPHY,
    AttachmentCategoryDto.X_RAY,
    AttachmentCategoryDto.CBCT,
    AttachmentCategoryDto.CONSENT,
    AttachmentCategoryDto.PDF,
    AttachmentCategoryDto.VIDEO,
    AttachmentCategoryDto.OTHER,
  ])('persists correct metadata for category %s', async (category) => {
    const visitRepository = new FakeVisitRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const objectStorage = new FakeObjectStorageService();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new UploadAttachmentUseCase(visitRepository, attachmentRepository, objectStorage, 'parakita-attachments', auditService);

    const attachment = await useCase.execute({
      visitId: visit.id,
      patientId: 'p1',
      category,
      file: buildFile(),
      actorUserId: 'doc-1',
    });

    expect(attachment.category).toBe(category);
    expect(attachment.currentVersion?.fileName).toBe('xray.jpg');
    expect(attachment.currentVersion?.mimeType).toBe('image/jpeg');
    expect(attachment.currentVersion?.versionNumber).toBe(1);
    expect(auditService.records).toHaveLength(1);
  });

  it('creates a new version rather than overwriting when re-uploading a correction', async () => {
    const visitRepository = new FakeVisitRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const objectStorage = new FakeObjectStorageService();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new UploadAttachmentUseCase(visitRepository, attachmentRepository, objectStorage, 'parakita-attachments', auditService);

    const first = await useCase.execute({
      visitId: visit.id,
      patientId: 'p1',
      category: AttachmentCategoryDto.X_RAY,
      file: buildFile('xray-v1.jpg', 'original-bytes'),
      actorUserId: 'doc-1',
    });

    const second = await useCase.execute({
      visitId: visit.id,
      patientId: 'p1',
      category: AttachmentCategoryDto.X_RAY,
      attachmentId: first.id,
      file: buildFile('xray-v2.jpg', 'corrected-bytes'),
      actorUserId: 'doc-1',
    });

    expect(second.id).toBe(first.id);
    expect(second.currentVersion?.versionNumber).toBe(2);
    const versions = await attachmentRepository.findVersions(first.id);
    expect(versions).toHaveLength(2);
    expect(versions[0].fileName).toBe('xray-v1.jpg');
    expect(versions[1].fileName).toBe('xray-v2.jpg');
  });

  it('rejects a re-upload targeting an attachment from a different visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const attachmentRepository = new FakeAttachmentRepository();
    const objectStorage = new FakeObjectStorageService();
    const auditService = new FakeAuditService();
    const visit1 = await seedVisit(visitRepository);
    const visit2 = await visitRepository.create({ visitNo: 'VIS000002', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q2', createdBy: 'doc-1' });
    const useCase = new UploadAttachmentUseCase(visitRepository, attachmentRepository, objectStorage, 'parakita-attachments', auditService);

    const first = await useCase.execute({
      visitId: visit1.id,
      patientId: 'p1',
      category: AttachmentCategoryDto.PDF,
      file: buildFile(),
      actorUserId: 'doc-1',
    });

    await expect(
      useCase.execute({
        visitId: visit2.id,
        patientId: 'p1',
        category: AttachmentCategoryDto.PDF,
        attachmentId: first.id,
        file: buildFile(),
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(AttachmentNotFoundException);
  });
});
