import { Province } from '@prisma/client';

// task-285 (Epic PE2): read-only lookup catalog -- no Create/Update/Delete
// use case exists at launch (seeded reference data only, see the task's
// own Backend Scope).
export interface IProvinceRepository {
  list(): Promise<Province[]>;
  // task-286: consumed by Patient's region-chain FK validation (module
  // boundary honored -- Patient never queries the `provinces` table
  // directly, only through this published repository interface).
  findById(id: string): Promise<Province | null>;
}
