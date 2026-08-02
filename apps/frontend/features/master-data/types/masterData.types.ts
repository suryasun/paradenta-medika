// Mirrors the raw Prisma row shape returned by apps/backend's
// crudControllerFactory (Master Data has no dedicated response DTOs --
// task-021..026 pass the entity straight through). Only the fields the
// Reservation/Queue/EMR pickers actually need are typed here; this is not
// a full Doctor/Branch admin feature yet.
export interface Doctor {
  id: string;
  doctorCode: string;
  branchId: string;
  fullName: string;
  specialization: string | null;
  isActive: boolean;
}
