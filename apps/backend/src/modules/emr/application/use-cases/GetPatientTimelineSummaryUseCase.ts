import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IMedicalHistoryRepository } from '../../domain/repositories/IMedicalHistoryRepository';
import { IAllergyRepository } from '../../domain/repositories/IAllergyRepository';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { TimelineSummaryResponseDto } from '../dtos/TimelineSummaryResponseDto';
import { toVisitResponse } from '../mappers/VisitMapper';
import { toMedicalHistoryResponseDto } from '../mappers/MedicalHistoryMapper';
import { toAllergyResponseDto } from '../mappers/AllergyMapper';
import { toTreatmentPlanItemResponseDto } from '../mappers/TreatmentPlanMapper';
import { toPrescriptionResponseDto } from '../mappers/PrescriptionMapper';

/**
 * docs/06-tasks/task-092.md Backend Scope: "condense the full timeline into
 * key highlights (most recent visit, active allergies/medical alerts, open
 * treatment plan items, last prescription)" -- these four fields are the
 * literal quoted list from the task, not an invented summary shape.
 */
export class GetPatientTimelineSummaryUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly visitRepository: IVisitRepository,
    private readonly medicalHistoryRepository: IMedicalHistoryRepository,
    private readonly allergyRepository: IAllergyRepository,
    private readonly treatmentPlanRepository: ITreatmentPlanRepository,
    private readonly prescriptionRepository: IPrescriptionRepository,
  ) {}

  async execute(patientId: string): Promise<TimelineSummaryResponseDto> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const [visits, activeMedicalHistory, allergies, openTreatmentPlanItems, prescriptions] = await Promise.all([
      this.visitRepository.findByPatientId(patientId),
      this.medicalHistoryRepository.findActiveByPatientId(patientId),
      this.allergyRepository.findByPatientId(patientId),
      this.treatmentPlanRepository.findOpenByPatientId(patientId),
      this.prescriptionRepository.findByPatientId(patientId),
    ]);

    const mostRecentVisit = visits.length > 0 ? visits[visits.length - 1] : null;
    const lastPrescription = prescriptions.length > 0 ? prescriptions[prescriptions.length - 1] : null;

    return {
      mostRecentVisit: mostRecentVisit ? toVisitResponse(mostRecentVisit) : null,
      activeAlerts: {
        medicalHistory: activeMedicalHistory.map(toMedicalHistoryResponseDto),
        allergies: allergies.map(toAllergyResponseDto),
      },
      openTreatmentPlanItems: openTreatmentPlanItems.map(toTreatmentPlanItemResponseDto),
      lastPrescription: lastPrescription ? toPrescriptionResponseDto(lastPrescription) : null,
    };
  }
}
