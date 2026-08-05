import { District } from '@prisma/client';

// task-285 (Epic PE2): see IRegencyRepository's note on parent filtering.
export interface IDistrictRepository {
  list(regencyId?: string): Promise<District[]>;
  // task-286: see IProvinceRepository.findById's note.
  findById(id: string): Promise<District | null>;
}
