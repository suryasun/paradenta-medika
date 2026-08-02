import { createHash } from 'crypto';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { ConsentAlreadySignedException, ConsentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IConsentRepository } from '../../domain/repositories/IConsentRepository';
import { IConsentTemplateRepository } from '../../domain/repositories/IConsentTemplateRepository';
import { UploadAttachmentUseCase } from './UploadAttachmentUseCase';
import { AttachmentCategoryDto } from '../dtos/UploadAttachmentRequestDto';
import { ConsentSignerRelationshipDto } from '../dtos/SignConsentRequestDto';
import { ConsentResponseDto } from '../dtos/ConsentResponseDto';
import { toConsentResponseDto } from '../mappers/ConsentMapper';

export interface SignConsentInput {
  consentId: string;
  signerName: string;
  signerRelationship: ConsentSignerRelationshipDto;
  signatureData: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-086.md: "capture the signature..., render the signed
 * document immutable..., store the resulting signed document via task-078's
 * Upload Attachment flow with category 'Consent'." No PDF library is
 * approved (docs/03-sad Part 3.3D Section 42 "PDF Generation" is out of
 * scope), so a minimal plain-text document stands in for the PDF -- it is
 * uploaded through UploadAttachmentUseCase in-process (not via HTTP/
 * multer), reusing that flow rather than duplicating storage logic, per
 * the same reuse pattern already used for Treatment Plan -> Reservation
 * (task-064) and Follow Up -> Reservation (task-090).
 */
export class SignConsentUseCase {
  constructor(
    private readonly consentRepository: IConsentRepository,
    private readonly consentTemplateRepository: IConsentTemplateRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SignConsentInput): Promise<ConsentResponseDto> {
    const consent = await this.consentRepository.findById(input.consentId);
    if (!consent) {
      throw new ConsentNotFoundException();
    }
    if (consent.signedAt) {
      throw new ConsentAlreadySignedException();
    }

    const [template, patient, doctor] = await Promise.all([
      this.consentTemplateRepository.findById(consent.templateId),
      this.patientRepository.findById(consent.patientId),
      this.doctorRepository.findById(consent.doctorId),
    ]);

    const signedAt = new Date();
    const hash = createHash('sha256')
      .update(`${consent.id}|${input.signatureData}|${signedAt.toISOString()}`)
      .digest('hex');

    const documentText = [
      `CONSENT DOCUMENT`,
      `Document Number: ${consent.id}`,
      `Category: ${template?.category ?? 'UNKNOWN'}`,
      `Title: ${template?.title ?? 'Unknown'}`,
      '',
      template?.body ?? '',
      '',
      `Patient: ${patient?.patientName ?? consent.patientId}`,
      `Doctor: ${doctor?.fullName ?? consent.doctorId}`,
      `Procedure: ${consent.procedure}`,
      '',
      `Signed By: ${input.signerName} (${input.signerRelationship})`,
      `Signed At: ${signedAt.toISOString()}`,
      `Hash: ${hash}`,
    ].join('\n');
    const documentBuffer = Buffer.from(documentText, 'utf-8');

    const attachment = await this.uploadAttachmentUseCase.execute({
      visitId: consent.visitId,
      patientId: consent.patientId,
      category: AttachmentCategoryDto.CONSENT,
      attachmentType: template?.title,
      file: {
        originalname: `consent-${consent.id}.txt`,
        mimetype: 'text/plain',
        size: documentBuffer.length,
        buffer: documentBuffer,
      },
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
    });

    const signed = await this.consentRepository.sign(consent.id, {
      signerName: input.signerName,
      signerRelationship: input.signerRelationship,
      signatureData: input.signatureData,
      hash,
      signedAttachmentId: attachment.id,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Consent',
      consent.id,
      'UPDATE',
      { signedAt: null },
      { signedAt: signedAt.toISOString(), signerName: input.signerName, attachmentId: attachment.id },
      auditContext,
    );

    return toConsentResponseDto(signed);
  }
}
