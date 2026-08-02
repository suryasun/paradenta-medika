// Mirrors the raw Prisma row shape returned by apps/backend's
// crudControllerFactory (Master Data has no dedicated response DTOs --
// task-021..026 pass the entity straight through). Only the fields the
// Reservation/Queue/EMR pickers actually need are typed here; this is not
// a full Doctor/Branch/Treatment admin feature yet.
export interface Doctor {
  id: string;
  doctorCode: string;
  branchId: string;
  fullName: string;
  specialization: string | null;
  isActive: boolean;
}

export interface Treatment {
  id: string;
  treatmentCode: string;
  treatmentName: string;
  treatmentCategoryId: string;
  durationMinute: number | null;
  defaultPrice: number;
  doctorFee: number | null;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  methodCode: string;
  methodName: string;
  isCash: boolean;
  isActive: boolean;
}

// Mirrors apps/backend's ToothCondition (docs/06-tasks/task-067.md).
export type ToothConditionCategory =
  | "HEALTHY"
  | "DISEASE"
  | "RESTORATION"
  | "PROSTHODONTIC"
  | "ENDODONTIC"
  | "SURGICAL"
  | "ORTHODONTIC"
  | "IMPLANTOLOGY";

export interface ToothCondition {
  id: string;
  conditionCode: string;
  conditionName: string;
  category: ToothConditionCategory;
  colorCode: string | null;
  isActive: boolean;
}

// Mirrors apps/backend's ConsentTemplate (docs/06-tasks/task-085.md).
export type ConsentCategory = "GENERAL" | "CLINICAL" | "SURGICAL";

export interface ConsentTemplate {
  id: string;
  category: ConsentCategory;
  title: string;
  body: string;
  isActive: boolean;
}
