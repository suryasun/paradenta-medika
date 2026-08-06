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

// Phase 4, Epic BG (task-221/222/223 --
// docs/06-tasks/phase-4-documentation/epic-bg-centralized-master-data.md).
// `entityType` deliberately never collides with EMR's clinical `Referral`
// concept -- see docs/03-sad/12-module-patient.md §14.5's disambiguation.
export interface MasterDataTemplate {
  id: string;
  entityType: string;
  templatePayload: Record<string, unknown>;
  version: number;
  ownerClinicId: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplatePushStatus = "CREATED" | "UPDATED" | "CONFLICT";

export interface TemplatePushResult {
  branchId: string;
  status: TemplatePushStatus;
  // Phase 4 hardening: true when entityType is one of the adapter-registered
  // types (TREATMENT/PAYMENT_METHOD/TOOTH_CONDITION) and this push actually
  // wrote to that real entity, not just the JSON snapshot.
  appliedToEntity: boolean;
  appliedEntityId?: string;
}

/** Phase 4 hardening: the only entityType values that write to a real entity when pushed -- see masterDataTemplateEntityAdapters.ts on the backend. */
export const REAL_ENTITY_TEMPLATE_TYPES = ["TREATMENT", "PAYMENT_METHOD", "TOOTH_CONDITION"] as const;

export interface TemplateFieldDrift {
  field: string;
  pushedValue: unknown;
  currentValue: unknown;
}

export interface TemplateDriftEntry {
  branchId: string;
  pushedVersion: number;
  isStale: boolean;
  fieldDrifts: TemplateFieldDrift[];
}

// task-285 (Epic PE2, Patient Module Enhancement addendum). Read-only
// lookup catalogs -- mirrors apps/backend's Province/Regency/District/
// Village Prisma models straight through, same "no dedicated response
// DTO" convention as every other Master Data entity in this file.
export interface Province {
  id: string;
  provinceCode: string;
  provinceName: string;
  isActive: boolean;
}

export interface Regency {
  id: string;
  provinceId: string;
  regencyCode: string;
  regencyName: string;
  isActive: boolean;
}

export interface District {
  id: string;
  regencyId: string;
  districtCode: string;
  districtName: string;
  isActive: boolean;
}

export interface Village {
  id: string;
  districtId: string;
  villageCode: string;
  villageName: string;
  postalCode: string | null;
  isActive: boolean;
}

// task-287 (Epic PE4, Patient Module Enhancement addendum). Read-only
// lookup catalog -- marketing/lead-source tracking, deliberately distinct
// from the clinical Referral entity (EMR module).
export interface ReferralSource {
  id: string;
  referralSourceCode: string;
  referralSourceName: string;
  requiresReferrer: boolean;
  isActive: boolean;
}
