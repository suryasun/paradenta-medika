import { SignConsentUseCase } from './SignConsentUseCase';
import { UploadAttachmentUseCase } from './UploadAttachmentUseCase';
import {
  FakeAttachmentRepository,
  FakeConsentRepository,
  FakeConsentTemplateRepository,
  FakeVisitRepository,
} from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeObjectStorageService } from '../../../../../tests/fakes/storageFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { ConsentAlreadySignedException, ConsentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { ConsentSignerRelationshipDto } from '../dtos/SignConsentRequestDto';

function buildSut() {
  const visitRepository = new FakeVisitRepository();
  const attachmentRepository = new FakeAttachmentRepository();
  const objectStorage = new FakeObjectStorageService();
  const auditService = new FakeAuditService();
  const consentRepository = new FakeConsentRepository();
  const consentTemplateRepository = new FakeConsentTemplateRepository();
  const patientRepository = new FakePatientRepository();
  const doctorRepository = new FakeDoctorRepository();
  const uploadAttachmentUseCase = new UploadAttachmentUseCase(
    visitRepository,
    attachmentRepository,
    objectStorage,
    'parakita-attachments',
    auditService,
  );
  const useCase = new SignConsentUseCase(
    consentRepository,
    consentTemplateRepository,
    patientRepository,
    doctorRepository,
    uploadAttachmentUseCase,
    auditService,
  );
  return { visitRepository, attachmentRepository, consentRepository, consentTemplateRepository, patientRepository, doctorRepository, useCase };
}

describe('SignConsentUseCase (task-086)', () => {
  it('rejects signing a non-existent consent', async () => {
    const { useCase } = buildSut();

    await expect(
      useCase.execute({
        consentId: 'missing',
        signerName: 'John Doe',
        signerRelationship: ConsentSignerRelationshipDto.SELF,
        signatureData: 'data:image/png;base64,abc',
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(ConsentNotFoundException);
  });

  it('produces an immutable signed record and a corresponding Attachment', async () => {
    const { visitRepository, attachmentRepository, consentRepository, consentTemplateRepository, patientRepository, doctorRepository, useCase } =
      buildSut();
    const patient = await patientRepository.create('MRN000020', {
      patientName: 'Consent Test Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120009999',
      address: 'Jl. Test No. 20',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC40', userId: 'u40', branchId: 'branch-1', fullName: 'Dr. Consent' });
    const visit = await visitRepository.create({
      visitNo: 'VIS000001',
      patientId: patient.id,
      doctorId: doctor.id,
      branchId: 'b1',
      queueId: 'q1',
      createdBy: 'doc-1',
    });
    const template = await consentTemplateRepository.create({ category: 'SURGICAL', title: 'Extraction Consent', body: 'Risks and benefits...' });
    const consent = await consentRepository.create({
      templateId: template.id,
      patientId: patient.id,
      visitId: visit.id,
      doctorId: doctor.id,
      procedure: 'Tooth Extraction',
      createdBy: 'doc-1',
    });

    const signed = await useCase.execute({
      consentId: consent.id,
      signerName: 'John Doe',
      signerRelationship: ConsentSignerRelationshipDto.SELF,
      signatureData: 'data:image/png;base64,abc',
      actorUserId: 'doc-1',
    });

    expect(signed.signedAt).not.toBeNull();
    expect(signed.signerName).toBe('John Doe');
    expect(signed.hash).toHaveLength(64);
    expect(signed.signedAttachmentId).not.toBeNull();

    const attachment = await attachmentRepository.findById(signed.signedAttachmentId!);
    expect(attachment?.category).toBe('CONSENT');
    expect(attachment?.currentVersion?.fileName).toBe(`consent-${consent.id}.txt`);
  });

  it('rejects re-signing an already-signed consent', async () => {
    const { visitRepository, consentRepository, consentTemplateRepository, patientRepository, doctorRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000021', {
      patientName: 'Re-sign Test Patient',
      gender: 'FEMALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120001010',
      address: 'Jl. Test No. 21',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC41', userId: 'u41', branchId: 'branch-1', fullName: 'Dr. ReSign' });
    const visit = await visitRepository.create({
      visitNo: 'VIS000002',
      patientId: patient.id,
      doctorId: doctor.id,
      branchId: 'b1',
      queueId: 'q2',
      createdBy: 'doc-1',
    });
    const template = await consentTemplateRepository.create({ category: 'CLINICAL', title: 'Filling Consent', body: 'Body' });
    const consent = await consentRepository.create({
      templateId: template.id,
      patientId: patient.id,
      visitId: visit.id,
      doctorId: doctor.id,
      procedure: 'Composite Filling',
      createdBy: 'doc-1',
    });

    await useCase.execute({
      consentId: consent.id,
      signerName: 'Jane Doe',
      signerRelationship: ConsentSignerRelationshipDto.SELF,
      signatureData: 'sig-1',
      actorUserId: 'doc-1',
    });

    await expect(
      useCase.execute({
        consentId: consent.id,
        signerName: 'Jane Doe',
        signerRelationship: ConsentSignerRelationshipDto.SELF,
        signatureData: 'sig-2',
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(ConsentAlreadySignedException);
  });
});
