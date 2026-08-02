import { MedicalCertificateType } from '@prisma/client';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { OnlyDoctorCanIssueCertificateException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IMedicalCertificateRepository } from '../../domain/repositories/IMedicalCertificateRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { CertificateNumberGenerator } from '../services/CertificateNumberGenerator';
import { UploadAttachmentUseCase } from './UploadAttachmentUseCase';
import { AttachmentCategoryDto } from '../dtos/UploadAttachmentRequestDto';
import { MedicalCertificateTypeDto } from '../dtos/IssueMedicalCertificateRequestDto';
import { MedicalCertificateResponseDto } from '../dtos/MedicalCertificateResponseDto';
import { toMedicalCertificateResponseDto } from '../mappers/MedicalCertificateMapper';

export interface IssueMedicalCertificateInput {
  visitId: string;
  certificateType: MedicalCertificateTypeDto;
  content: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-088.md + docs/03-sad/15-module-emr.md Section 25:
 * "Hanya Doctor yang dapat menerbitkan" is enforced by the `emr.certificate.
 * issue` permission (seeded to DOCTOR only, per the same pattern used by
 * every other "(Doctor role)" task this session) AND, because this is the
 * one task whose Testing Required explicitly demands a use-case-level unit
 * test for Doctor-only enforcement, a second check here: the acting user
 * must resolve to a registered Doctor via IDoctorRepository.findByUserId.
 * The resulting document is stored via task-078's Upload Attachment flow
 * in-process, reusing UploadAttachmentUseCase rather than duplicating
 * storage logic, per the same reuse pattern as SignConsentUseCase.
 */
export class IssueMedicalCertificateUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly medicalCertificateRepository: IMedicalCertificateRepository,
    private readonly certificateNumberGenerator: CertificateNumberGenerator,
    private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: IssueMedicalCertificateInput): Promise<MedicalCertificateResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    const doctor = await this.doctorRepository.findByUserId(input.actorUserId);
    if (!doctor) {
      throw new OnlyDoctorCanIssueCertificateException();
    }

    const issuedAt = new Date();
    const certificateNumber = await this.certificateNumberGenerator.generate(issuedAt);

    const documentText = [
      `MEDICAL CERTIFICATE`,
      `Certificate Number: ${certificateNumber}`,
      `Type: ${input.certificateType}`,
      `Issued At: ${issuedAt.toISOString()}`,
      '',
      input.content,
      '',
      `Doctor: ${doctor.fullName}`,
    ].join('\n');
    const documentBuffer = Buffer.from(documentText, 'utf-8');

    const attachment = await this.uploadAttachmentUseCase.execute({
      visitId: visit.id,
      patientId: visit.patientId,
      category: AttachmentCategoryDto.PDF,
      attachmentType: 'Medical Certificate',
      file: {
        originalname: `medical-certificate-${certificateNumber}.txt`,
        mimetype: 'text/plain',
        size: documentBuffer.length,
        buffer: documentBuffer,
      },
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
    });

    const certificate = await this.medicalCertificateRepository.create({
      certificateNumber,
      visitId: visit.id,
      patientId: visit.patientId,
      doctorId: doctor.id,
      certificateType: input.certificateType as unknown as MedicalCertificateType,
      content: input.content,
      attachmentId: attachment.id,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'MedicalCertificate',
      certificate.id,
      'CREATE',
      null,
      { certificateNumber, certificateType: input.certificateType, attachmentId: attachment.id },
      auditContext,
    );

    return toMedicalCertificateResponseDto(certificate);
  }
}
