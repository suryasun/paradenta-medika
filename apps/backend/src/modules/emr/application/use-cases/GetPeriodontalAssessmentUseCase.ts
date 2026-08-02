import { PeriodontalAssessmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IPeriodontalAssessmentRepository } from '../../domain/repositories/IPeriodontalAssessmentRepository';
import { IPeriodontalMeasurementRepository } from '../../domain/repositories/IPeriodontalMeasurementRepository';
import { PeriodontalAssessmentDetailResponseDto } from '../dtos/PeriodontalResponseDto';
import { toPeriodontalAssessmentResponseDto, toPeriodontalMeasurementResponseDto } from '../mappers/PeriodontalMapper';

/** docs/06-tasks/task-075.md: full assessment with all its measurements. */
export class GetPeriodontalAssessmentUseCase {
  constructor(
    private readonly assessmentRepository: IPeriodontalAssessmentRepository,
    private readonly measurementRepository: IPeriodontalMeasurementRepository,
  ) {}

  async execute(assessmentId: string): Promise<PeriodontalAssessmentDetailResponseDto> {
    const assessment = await this.assessmentRepository.findById(assessmentId);
    if (!assessment) {
      throw new PeriodontalAssessmentNotFoundException();
    }

    const measurements = await this.measurementRepository.findByAssessmentId(assessmentId);

    return {
      ...toPeriodontalAssessmentResponseDto(assessment),
      measurements: measurements.map(toPeriodontalMeasurementResponseDto),
    };
  }
}
