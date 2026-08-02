import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IOdontogramRepository } from '../../domain/repositories/IOdontogramRepository';
import { OdontogramEntryResponseDto } from '../dtos/OdontogramEntryResponseDto';
import { toOdontogramEntryResponseDto } from '../mappers/OdontogramMapper';

function currentStateKey(toothNumber: number, surface: string | null): string {
  return `${toothNumber}|${surface ?? ''}`;
}

/**
 * docs/06-tasks/task-069.md: "for each of the patient's 32 teeth, return
 * the latest (current) condition version per surface." Entries are
 * append-only (see RecordToothConditionUseCase), so "current" is derived
 * here by keeping only the most recent row per (toothNumber, surface) pair
 * rather than being tracked by a stored flag.
 */
export class GetCurrentOdontogramUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly odontogramRepository: IOdontogramRepository,
  ) {}

  async execute(patientId: string): Promise<OdontogramEntryResponseDto[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const allEntries = await this.odontogramRepository.findAllByPatientId(patientId);
    const latestByKey = new Map<string, OdontogramEntryResponseDto>();
    for (const entry of allEntries) {
      const key = currentStateKey(entry.toothNumber, entry.surface);
      if (!latestByKey.has(key)) {
        latestByKey.set(key, toOdontogramEntryResponseDto(entry));
      }
    }

    return [...latestByKey.values()];
  }
}
