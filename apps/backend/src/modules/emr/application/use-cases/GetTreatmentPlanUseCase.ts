import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlanItemResponseDto } from '../dtos/TreatmentPlanItemResponseDto';
import { toTreatmentPlanItemResponseDto } from '../mappers/TreatmentPlanMapper';

/** docs/06-tasks/task-064.md's Security Impact names `emr.treatment-plan.read`, implying this read side exists. */
export class GetTreatmentPlanUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly treatmentPlanRepository: ITreatmentPlanRepository,
  ) {}

  async execute(visitId: string): Promise<TreatmentPlanItemResponseDto[]> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }

    const items = await this.treatmentPlanRepository.findByVisitId(visitId);
    return items.map(toTreatmentPlanItemResponseDto);
  }
}
