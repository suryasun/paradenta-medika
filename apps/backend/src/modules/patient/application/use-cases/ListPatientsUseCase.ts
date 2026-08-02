import { PagedResult } from '../../../../shared/http/pagination';
import { IPatientRepository, PatientListFilters } from '../../domain/repositories/IPatientRepository';
import { PatientResponseDto } from '../dtos/PatientResponseDto';
import { toPatientResponse } from '../mappers/PatientMapper';

export class ListPatientsUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(filters: PatientListFilters): Promise<PagedResult<PatientResponseDto>> {
    const { items, total } = await this.patientRepository.search(filters);
    return { items: items.map(toPatientResponse), total };
  }
}
