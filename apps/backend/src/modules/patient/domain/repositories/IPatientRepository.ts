import { Patient } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { PatientProps } from '../entities/PatientEntity';

export interface PatientListFilters extends ListQueryDto {
  status?: 'ACTIVE' | 'ARCHIVED';
  gender?: 'MALE' | 'FEMALE';
}

export type UpdatePatientProps = Partial<Omit<PatientProps, 'identityNumber' | 'identityType'>> & {
  identityType?: PatientProps['identityType'];
  identityNumber?: PatientProps['identityNumber'];
};

/**
 * docs/03-sad/12-module-patient.md Section 18.3 Standard Methods
 * (merge() is out of scope -- not required by any Phase 1 task).
 */
export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByMRN(medicalRecordNo: string): Promise<Patient | null>;
  findByIdentityNumber(identityType: string, identityNumber: string): Promise<Patient | null>;
  search(filters: PatientListFilters): Promise<PagedResult<Patient>>;
  create(medicalRecordNo: string, props: PatientProps): Promise<Patient>;
  update(id: string, props: UpdatePatientProps): Promise<Patient>;
  archive(id: string): Promise<Patient>;
  restore(id: string): Promise<Patient>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
}
