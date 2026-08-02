import { PeriodontalAssessmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IPeriodontalAssessmentRepository } from '../../domain/repositories/IPeriodontalAssessmentRepository';
import { PeriodontalAssessmentResponseDto } from '../dtos/PeriodontalResponseDto';
import { toPeriodontalAssessmentResponseDto } from '../mappers/PeriodontalMapper';

/**
 * docs/06-tasks/task-076.md: "returning prior assessments for the same
 * patient" -- compares periodontal status across multiple visits. Resolves
 * the target assessment first (as the route's {assessmentId} implies) to
 * find its patient, then returns every assessment for that patient in
 * chronological order.
 */
export class GetPeriodontalAssessmentHistoryUseCase {
  constructor(private readonly assessmentRepository: IPeriodontalAssessmentRepository) {}

  async execute(assessmentId: string): Promise<PeriodontalAssessmentResponseDto[]> {
    const assessment = await this.assessmentRepository.findById(assessmentId);
    if (!assessment) {
      throw new PeriodontalAssessmentNotFoundException();
    }

    const history = await this.assessmentRepository.findByPatientId(assessment.patientId);
    return history.map(toPeriodontalAssessmentResponseDto);
  }
}
