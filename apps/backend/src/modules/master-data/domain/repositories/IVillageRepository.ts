import { Village } from '@prisma/client';

// task-285 (Epic PE2): see IRegencyRepository's note on parent filtering.
export interface IVillageRepository {
  list(districtId?: string): Promise<Village[]>;
  // task-286: see IProvinceRepository.findById's note.
  findById(id: string): Promise<Village | null>;
}
