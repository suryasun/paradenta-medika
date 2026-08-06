import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { ISoapNoteRepository } from '../../domain/repositories/ISoapNoteRepository';
import { IVisitDiagnosisRepository } from '../../domain/repositories/IVisitDiagnosisRepository';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';
import { IVitalSignRepository } from '../../domain/repositories/IVitalSignRepository';
import { IInvoiceRepository } from '../../../billing/domain/repositories/IInvoiceRepository';
import { VisitDetailResponseDto } from '../dtos/VisitResponseDto';
import { toVisitDetailResponse } from '../mappers/VisitMapper';

export class GetVisitDetailUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly vitalSignRepository: IVitalSignRepository,
    private readonly soapNoteRepository: ISoapNoteRepository,
    private readonly diagnosisRepository: IVisitDiagnosisRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(visitId: string): Promise<VisitDetailResponseDto> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }

    const [vitalSigns, soapNote, diagnoses, treatmentEntries, invoice] = await Promise.all([
      this.vitalSignRepository.findByVisitId(visitId),
      this.soapNoteRepository.findByVisitId(visitId),
      this.diagnosisRepository.findByVisitId(visitId),
      this.visitTreatmentRepository.findByVisitIdWithMaterials(visitId),
      this.invoiceRepository.findByVisitId(visitId),
    ]);

    // docs/06-tasks/task-318.md
    const isTreatmentLocked = invoice?.status === 'PAID';

    return toVisitDetailResponse(visit, vitalSigns, soapNote, diagnoses, treatmentEntries, isTreatmentLocked);
  }
}
