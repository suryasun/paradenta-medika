import { GetPatientTimelineAttachmentsUseCase } from './GetPatientTimelineAttachmentsUseCase';
import { FakeAttachmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const attachmentRepository = new FakeAttachmentRepository();
  const useCase = new GetPatientTimelineAttachmentsUseCase(patientRepository, attachmentRepository);
  return { patientRepository, attachmentRepository, useCase };
}

describe('GetPatientTimelineAttachmentsUseCase (task-094)', () => {
  it('rejects a non-existent patient', async () => {
    const { useCase } = buildSut();
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PatientNotFoundException);
  });

  it('returns all non-archived attachments across all of the patient visits, excluding other patients', async () => {
    const { patientRepository, attachmentRepository, useCase } = buildSut();
    const patientA = await patientRepository.create('MRN000035', {
      patientName: 'Gallery Patient A',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003500',
      address: 'Jl. Gallery No. 1',
    });
    const patientB = await patientRepository.create('MRN000036', {
      patientName: 'Gallery Patient B',
      gender: 'FEMALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003600',
      address: 'Jl. Gallery No. 2',
    });

    const fileInput = {
      fileName: 'photo.jpg',
      storedName: 'stored.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      fileSize: 100,
      bucket: 'b',
      objectKey: 'k',
      checksum: 'c',
    };
    const visit1Attachment = await attachmentRepository.createWithFirstVersion({
      visitId: 'visit-1',
      patientId: patientA.id,
      category: 'CLINICAL_PHOTOGRAPHY',
      file: fileInput,
      createdBy: 'doc-1',
    });
    const visit2Attachment = await attachmentRepository.createWithFirstVersion({
      visitId: 'visit-2',
      patientId: patientA.id,
      category: 'X_RAY',
      file: fileInput,
      createdBy: 'doc-1',
    });
    const archived = await attachmentRepository.createWithFirstVersion({
      visitId: 'visit-1',
      patientId: patientA.id,
      category: 'X_RAY',
      file: fileInput,
      createdBy: 'doc-1',
    });
    await attachmentRepository.archive(archived.id, 'doc-1');
    await attachmentRepository.createWithFirstVersion({
      visitId: 'visit-3',
      patientId: patientB.id,
      category: 'CLINICAL_PHOTOGRAPHY',
      file: fileInput,
      createdBy: 'doc-1',
    });

    const result = await useCase.execute(patientA.id);

    expect(result.map((a) => a.id).sort()).toEqual([visit1Attachment.id, visit2Attachment.id].sort());
  });
});
