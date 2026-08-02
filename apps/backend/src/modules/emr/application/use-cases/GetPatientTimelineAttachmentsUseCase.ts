import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { AttachmentResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentResponseDto } from '../mappers/AttachmentMapper';

/** docs/06-tasks/task-094.md: "all attachments across all of the patient's visits, distinct from task-082's single-visit scope." */
export class GetPatientTimelineAttachmentsUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(patientId: string): Promise<AttachmentResponseDto[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const attachments = await this.attachmentRepository.findByPatientId(patientId, false);
    return attachments.map(toAttachmentResponseDto);
  }
}
