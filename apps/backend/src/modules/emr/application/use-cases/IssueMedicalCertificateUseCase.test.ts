import { IssueMedicalCertificateUseCase } from './IssueMedicalCertificateUseCase';
import { UploadAttachmentUseCase } from './UploadAttachmentUseCase';
import { CertificateNumberGenerator } from '../services/CertificateNumberGenerator';
import { FakeAttachmentRepository, FakeMedicalCertificateRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeObjectStorageService } from '../../../../../tests/fakes/storageFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { OnlyDoctorCanIssueCertificateException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { MedicalCertificateTypeDto } from '../dtos/IssueMedicalCertificateRequestDto';

function buildSut() {
  const visitRepository = new FakeVisitRepository();
  const doctorRepository = new FakeDoctorRepository();
  const medicalCertificateRepository = new FakeMedicalCertificateRepository();
  const certificateNumberGenerator = new CertificateNumberGenerator(medicalCertificateRepository);
  const attachmentRepository = new FakeAttachmentRepository();
  const objectStorage = new FakeObjectStorageService();
  const auditService = new FakeAuditService();
  const uploadAttachmentUseCase = new UploadAttachmentUseCase(
    visitRepository,
    attachmentRepository,
    objectStorage,
    'parakita-attachments',
    auditService,
  );
  const useCase = new IssueMedicalCertificateUseCase(
    visitRepository,
    doctorRepository,
    medicalCertificateRepository,
    certificateNumberGenerator,
    uploadAttachmentUseCase,
    auditService,
  );
  return { visitRepository, doctorRepository, medicalCertificateRepository, attachmentRepository, useCase };
}

describe('IssueMedicalCertificateUseCase (task-088)', () => {
  it('rejects issuing against a non-existent visit', async () => {
    const { doctorRepository, useCase } = buildSut();
    await doctorRepository.create({ doctorCode: 'DOC50', userId: 'doc-user-1', branchId: 'b1', fullName: 'Dr. Missing Visit' });

    await expect(
      useCase.execute({
        visitId: 'missing',
        certificateType: MedicalCertificateTypeDto.FIT_TO_WORK,
        content: 'Fit to work from 2026-08-03.',
        actorUserId: 'doc-user-1',
      }),
    ).rejects.toBeInstanceOf(VisitNotFoundException);
  });

  it('rejects issuing when the acting user is not a registered Doctor', async () => {
    const { visitRepository, useCase } = buildSut();
    const visit = await visitRepository.create({
      visitNo: 'VIS000010',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      queueId: 'q10',
      createdBy: 'nurse-1',
    });

    await expect(
      useCase.execute({
        visitId: visit.id,
        certificateType: MedicalCertificateTypeDto.SICK_LEAVE,
        content: 'Sick leave for 3 days.',
        actorUserId: 'nurse-1',
      }),
    ).rejects.toBeInstanceOf(OnlyDoctorCanIssueCertificateException);
  });

  it('issues a certificate with a unique, auto-generated certificate number and stores it as a retrievable Attachment', async () => {
    const { visitRepository, doctorRepository, medicalCertificateRepository, attachmentRepository, useCase } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC51', userId: 'doc-user-2', branchId: 'b1', fullName: 'Dr. Certificate' });
    const visitA = await visitRepository.create({
      visitNo: 'VIS000011',
      patientId: 'p1',
      doctorId: doctor.id,
      branchId: 'b1',
      queueId: 'q11',
      createdBy: 'doc-user-2',
    });
    const visitB = await visitRepository.create({
      visitNo: 'VIS000012',
      patientId: 'p2',
      doctorId: doctor.id,
      branchId: 'b1',
      queueId: 'q12',
      createdBy: 'doc-user-2',
    });

    const first = await useCase.execute({
      visitId: visitA.id,
      certificateType: MedicalCertificateTypeDto.DENTAL_TREATMENT_CERTIFICATE,
      content: 'Underwent dental treatment on 2026-08-02.',
      actorUserId: 'doc-user-2',
    });
    const second = await useCase.execute({
      visitId: visitB.id,
      certificateType: MedicalCertificateTypeDto.MEDICAL_STATEMENT,
      content: 'Medical statement for insurance purposes.',
      actorUserId: 'doc-user-2',
    });

    expect(first.certificateNumber).not.toBe(second.certificateNumber);
    expect(await medicalCertificateRepository.findByCertificateNumber(first.certificateNumber)).not.toBeNull();

    const attachment = await attachmentRepository.findById(first.attachmentId);
    expect(attachment?.category).toBe('PDF');
    expect(attachment?.currentVersion?.fileName).toBe(`medical-certificate-${first.certificateNumber}.txt`);
  });
});
