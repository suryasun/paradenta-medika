import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { InvalidToothNumberException } from '../../domain/exceptions/EmrExceptions';
import { IOdontogramRepository } from '../../domain/repositories/IOdontogramRepository';
import { isValidFdiToothNumber } from '../../domain/services/fdiToothNumbers';
import { OdontogramEntryResponseDto } from '../dtos/OdontogramEntryResponseDto';
import { toOdontogramEntryResponseDto } from '../mappers/OdontogramMapper';

/**
 * docs/06-tasks/task-070.md: full chronological history for a single tooth
 * -- every version, not just the latest (contrast with
 * GetCurrentOdontogramUseCase).
 */
export class GetToothHistoryUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly odontogramRepository: IOdontogramRepository,
  ) {}

  async execute(patientId: string, toothNumber: number): Promise<OdontogramEntryResponseDto[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }
    if (!isValidFdiToothNumber(toothNumber)) {
      throw new InvalidToothNumberException();
    }

    const entries = await this.odontogramRepository.findByPatientIdAndTooth(patientId, toothNumber);
    return entries.map(toOdontogramEntryResponseDto);
  }
}
