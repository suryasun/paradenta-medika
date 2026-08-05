import { Regency } from '@prisma/client';

// task-285 (Epic PE2): parent filtering is a read-layer convenience, not a
// strict validation gate -- an invalid/nonexistent provinceId simply
// yields an empty list, per the task's own Acceptance Criteria.
export interface IRegencyRepository {
  list(provinceId?: string): Promise<Regency[]>;
  // task-286: see IProvinceRepository.findById's note.
  findById(id: string): Promise<Regency | null>;
}
