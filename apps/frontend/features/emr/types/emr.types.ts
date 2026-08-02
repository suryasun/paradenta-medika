// Mirrors apps/backend/src/modules/emr/application/dtos/VisitResponseDto.ts
export interface Visit {
  id: string;
  visitNo: string;
  reservationId: string | null;
  patientId: string;
  doctorId: string;
  branchId: string;
  queueId: string;
  visitDate: string;
  chiefComplaint: string | null;
  status: "DRAFT" | "WAITING_EXAMINATION" | "IN_PROGRESS" | "COMPLETED" | "LOCKED" | "ARCHIVED";
  startedAt: string | null;
  finishedAt: string | null;
}

export interface VitalSign {
  id: string;
  bloodPressure: string | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  oxygenSaturation: number | null;
  recordedAt: string;
}

export interface SoapNote {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
}

export type DiagnosisType = "PRIMARY" | "SECONDARY" | "DIFFERENTIAL";

export interface Diagnosis {
  id: string;
  diagnosisType: DiagnosisType;
  diagnosisName: string;
  notes: string | null;
}

export interface TreatmentEntry {
  id: string;
  treatmentId: string;
  toothReference: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
}

export interface VisitDetail extends Visit {
  vitalSigns: VitalSign[];
  soapNote: SoapNote | null;
  diagnoses: Diagnosis[];
  treatmentEntries: TreatmentEntry[];
}

export interface RecordVitalSignInput {
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
}

export interface SoapNoteInput {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface DiagnosisEntryInput {
  diagnosisType: DiagnosisType;
  diagnosisName: string;
  notes?: string;
}

export interface RecordTreatmentInput {
  treatmentId: string;
  toothReference?: string;
  quantity?: number;
  notes?: string;
}

export const OPEN_VISIT_STATUSES: Visit["status"][] = ["DRAFT", "WAITING_EXAMINATION", "IN_PROGRESS"];

// Mirrors apps/backend/prisma/schema.prisma MedicalHistoryCategory
// (docs/03-sad/15-module-emr.md Section 18 "Categories" -- literal list).
export type MedicalHistoryCategory =
  | "SYSTEMIC_DISEASE"
  | "HEART_DISEASE"
  | "DIABETES"
  | "HYPERTENSION"
  | "HEPATITIS"
  | "HIV"
  | "BLEEDING_DISORDER"
  | "SURGERY_HISTORY"
  | "PREGNANCY"
  | "HOSPITALIZATION_HISTORY";

export const MEDICAL_HISTORY_CATEGORIES: MedicalHistoryCategory[] = [
  "SYSTEMIC_DISEASE",
  "HEART_DISEASE",
  "DIABETES",
  "HYPERTENSION",
  "HEPATITIS",
  "HIV",
  "BLEEDING_DISORDER",
  "SURGERY_HISTORY",
  "PREGNANCY",
  "HOSPITALIZATION_HISTORY",
];

export interface MedicalHistory {
  id: string;
  patientId: string;
  visitId: string | null;
  category: MedicalHistoryCategory;
  description: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface RecordMedicalHistoryInput {
  category: MedicalHistoryCategory;
  description: string;
  visitId?: string;
}

// Mirrors apps/backend/prisma/schema.prisma AllergyType/AllergySeverity
// (docs/03-sad/15-module-emr.md Section 19 "Allergy Types"/"Severity").
export type AllergyType = "DRUG" | "FOOD" | "LATEX" | "MATERIAL" | "LOCAL_ANESTHETIC" | "OTHER";
export const ALLERGY_TYPES: AllergyType[] = ["DRUG", "FOOD", "LATEX", "MATERIAL", "LOCAL_ANESTHETIC", "OTHER"];

export type AllergySeverity = "MILD" | "MODERATE" | "SEVERE";
export const ALLERGY_SEVERITIES: AllergySeverity[] = ["MILD", "MODERATE", "SEVERE"];

export interface Allergy {
  id: string;
  patientId: string;
  visitId: string | null;
  type: AllergyType;
  allergen: string;
  severity: AllergySeverity;
  reaction: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface RecordAllergyInput {
  type: AllergyType;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
  notes?: string;
  visitId?: string;
}

// Mirrors apps/backend's OdontogramEntry (docs/06-tasks/task-068.md/069.md/070.md).
export interface OdontogramEntry {
  id: string;
  visitId: string;
  patientId: string;
  toothNumber: number;
  surface: string | null;
  toothConditionId: string;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface RecordToothConditionInput {
  toothNumber: number;
  surface?: string;
  toothConditionId: string;
  note?: string;
}

// docs/03-sad/15-module-emr.md Part 3.1B Sections 12-14: permanent teeth
// (quadrants 1-4) + primary teeth (quadrants 5-8), mixed dentition.
const PERMANENT_QUADRANTS = [1, 2, 3, 4];
const PRIMARY_QUADRANTS = [5, 6, 7, 8];
const PERMANENT_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const PRIMARY_POSITIONS = [1, 2, 3, 4, 5];

function buildToothNumbers(quadrants: number[], positions: number[]): number[] {
  return quadrants.flatMap((quadrant) => positions.map((position) => quadrant * 10 + position));
}

export const FDI_TOOTH_NUMBERS: number[] = [
  ...buildToothNumbers(PERMANENT_QUADRANTS, PERMANENT_POSITIONS),
  ...buildToothNumbers(PRIMARY_QUADRANTS, PRIMARY_POSITIONS),
];

// Mirrors apps/backend's TreatmentPlanItem (docs/06-tasks/task-063.md/064.md).
export type TreatmentPlanPriority = "LOW" | "MEDIUM" | "HIGH";
export const TREATMENT_PLAN_PRIORITIES: TreatmentPlanPriority[] = ["LOW", "MEDIUM", "HIGH"];

export interface TreatmentPlanItem {
  id: string;
  visitId: string;
  patientId: string;
  treatmentId: string;
  toothNumber: number | null;
  surface: string | null;
  priority: TreatmentPlanPriority;
  estimatedCost: number;
  estimatedDurationMinute: number | null;
  createdAt: string;
  createdBy: string | null;
}

export interface TreatmentPlanItemEntryInput {
  treatmentId: string;
  toothNumber?: number;
  surface?: string;
  priority?: TreatmentPlanPriority;
  estimatedCost: number;
  estimatedDurationMinute?: number;
}

export interface ConvertTreatmentPlanToReservationInput {
  doctorId: string;
  reservationDate: string;
  startTime: string;
  reservationType: string;
  source: "WALK_IN" | "PHONE" | "WHATSAPP" | "WEBSITE" | "MOBILE_APP";
  complaint?: string;
  notes?: string;
}

// Mirrors apps/backend's PeriodontalAssessment/PeriodontalMeasurement
// (docs/06-tasks/task-071.md..task-077.md).
export type PeriodontalAssessmentStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "REVIEWED" | "LOCKED" | "ARCHIVED";

export type PeriodontalMeasurementPoint = "MB" | "B" | "DB" | "ML" | "L" | "DL";
export const PERIODONTAL_MEASUREMENT_POINTS: PeriodontalMeasurementPoint[] = ["MB", "B", "DB", "ML", "L", "DL"];

export const FURCATION_GRADES = ["0", "I", "II", "III"] as const;
export type FurcationGrade = (typeof FURCATION_GRADES)[number];

// docs/03-sad/15-module-emr.md Part 3.2B Section 18 "Applicable Teeth".
export const FURCATION_APPLICABLE_TEETH: number[] = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48];

export interface PeriodontalMeasurement {
  id: string;
  assessmentId: string;
  toothNumber: number;
  measurementPoint: PeriodontalMeasurementPoint;
  pocketDepth: number;
  gingivalMargin: number;
  cal: number;
  bleeding: boolean;
  plaqueIndex: number | null;
  mobility: number | null;
  furcation: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface PeriodontalAssessment {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  status: PeriodontalAssessmentStatus;
  lockedAt: string | null;
  lockedBy: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface PeriodontalAssessmentDetail extends PeriodontalAssessment {
  measurements: PeriodontalMeasurement[];
}

export interface SaveMeasurementInput {
  toothNumber: number;
  measurementPoint: PeriodontalMeasurementPoint;
  pocketDepth: number;
  gingivalMargin: number;
  bleeding: boolean;
  plaqueIndex?: number;
  mobility?: number;
  furcation?: string;
}

export type UpdateMeasurementInput = Partial<SaveMeasurementInput>;

// Mirrors apps/backend's Referral/FollowUp (docs/06-tasks/task-089.md/090.md).
export type ReferralTargetType = "SPECIALIST" | "HOSPITAL" | "LABORATORY" | "RADIOLOGY";
export const REFERRAL_TARGET_TYPES: ReferralTargetType[] = ["SPECIALIST", "HOSPITAL", "LABORATORY", "RADIOLOGY"];

export interface Referral {
  id: string;
  visitId: string;
  patientId: string;
  targetType: ReferralTargetType;
  reason: string;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface CreateReferralInput {
  targetType: ReferralTargetType;
  reason: string;
  note?: string;
}

export type FollowUpPriority = "LOW" | "MEDIUM" | "HIGH";
export const FOLLOW_UP_PRIORITIES: FollowUpPriority[] = ["LOW", "MEDIUM", "HIGH"];

export interface FollowUp {
  id: string;
  visitId: string;
  patientId: string;
  followUpDate: string;
  note: string | null;
  priority: FollowUpPriority;
  reservationId: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface CreateFollowUpInput {
  followUpDate: string;
  note?: string;
  priority?: FollowUpPriority;
  autoSchedule?: boolean;
  doctorId?: string;
  startTime?: string;
  reservationType?: string;
  source?: "WALK_IN" | "PHONE" | "WHATSAPP" | "WEBSITE" | "MOBILE_APP";
}

// Mirrors apps/backend's Attachment/AttachmentVersion/AttachmentAnnotation
// (docs/06-tasks/task-078.md..task-084.md).
export type AttachmentCategory = "CLINICAL_PHOTOGRAPHY" | "X_RAY" | "CBCT" | "CONSENT" | "PDF" | "VIDEO" | "OTHER";
export const ATTACHMENT_CATEGORIES: AttachmentCategory[] = ["CLINICAL_PHOTOGRAPHY", "X_RAY", "CBCT", "CONSENT", "PDF", "VIDEO", "OTHER"];

// docs/03-sad/15-module-emr.md Part 3.3A Section 5 Attachment Matrix.
const ANNOTATABLE_CATEGORIES: AttachmentCategory[] = ["CLINICAL_PHOTOGRAPHY", "X_RAY", "CBCT"];
export function isAttachmentAnnotatable(category: AttachmentCategory): boolean {
  return ANNOTATABLE_CATEGORIES.includes(category);
}

export interface AttachmentVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  createdAt: string;
  createdBy: string | null;
}

export interface Attachment {
  id: string;
  visitId: string;
  patientId: string;
  category: AttachmentCategory;
  attachmentType: string | null;
  currentVersion: AttachmentVersion | null;
  archivedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface AttachmentAnnotation {
  id: string;
  attachmentId: string;
  shape: string;
  positionX: number;
  positionY: number;
  width: number | null;
  height: number | null;
  text: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface AttachmentDetail extends Attachment {
  annotations: AttachmentAnnotation[];
}

export interface UploadAttachmentInput {
  visitId: string;
  patientId: string;
  category: AttachmentCategory;
  attachmentType?: string;
  attachmentId?: string;
  file: File;
}

export interface AnnotateAttachmentInput {
  shape: string;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  text?: string;
}

export interface DownloadAttachmentResult {
  url: string;
  expiresInSeconds: number;
}

// Mirrors apps/backend's Prescription/PrescriptionItem (docs/06-tasks/task-065.md/066.md).
export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string | null;
}

export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItem[];
  createdAt: string;
  createdBy: string | null;
}

export interface PrescriptionPrint extends Prescription {
  patientName: string;
  doctorName: string;
}

export interface PrescriptionItemEntryInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction?: string;
}

// Mirrors apps/backend's Consent (docs/06-tasks/task-085.md..task-087.md).
export type ConsentSignerRelationship = "SELF" | "FATHER" | "MOTHER" | "HUSBAND" | "WIFE" | "LEGAL_GUARDIAN";
export const CONSENT_SIGNER_RELATIONSHIPS: ConsentSignerRelationship[] = ["SELF", "FATHER", "MOTHER", "HUSBAND", "WIFE", "LEGAL_GUARDIAN"];

export interface Consent {
  id: string;
  templateId: string;
  patientId: string;
  visitId: string;
  doctorId: string;
  procedure: string;
  signedAt: string | null;
  signerName: string | null;
  signerRelationship: ConsentSignerRelationship | null;
  hash: string | null;
  signedAttachmentId: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface CreateConsentInput {
  visitId: string;
  templateId: string;
  procedure: string;
}

export interface SignConsentInput {
  signerName: string;
  signerRelationship: ConsentSignerRelationship;
  signatureData: string;
}

// Mirrors apps/backend's MedicalCertificate (docs/06-tasks/task-088.md;
// docs/03-sad/15-module-emr.md Section 25 "Certificate Types").
export type MedicalCertificateType = "FIT_TO_WORK" | "SICK_LEAVE" | "MEDICAL_STATEMENT" | "DENTAL_TREATMENT_CERTIFICATE";
export const MEDICAL_CERTIFICATE_TYPES: MedicalCertificateType[] = [
  "FIT_TO_WORK",
  "SICK_LEAVE",
  "MEDICAL_STATEMENT",
  "DENTAL_TREATMENT_CERTIFICATE",
];

export interface MedicalCertificate {
  id: string;
  certificateNumber: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  certificateType: MedicalCertificateType;
  content: string;
  issuedAt: string;
  attachmentId: string;
  createdAt: string;
  createdBy: string | null;
}

export interface IssueMedicalCertificateInput {
  certificateType: MedicalCertificateType;
  content: string;
}

// Mirrors apps/backend's timeline aggregation (docs/06-tasks/task-091.md..
// task-094.md). See apps/backend's TimelineEventResponseDto.ts for the
// literal source-table union this list is scoped to.
export type TimelineEventType =
  | "VISIT"
  | "SOAP"
  | "DIAGNOSIS"
  | "TREATMENT"
  | "PRESCRIPTION"
  | "ODONTOGRAM"
  | "ATTACHMENT"
  | "CONSENT"
  | "REFERRAL"
  | "FOLLOW_UP";

export const TIMELINE_EVENT_TYPES: TimelineEventType[] = [
  "VISIT",
  "SOAP",
  "DIAGNOSIS",
  "TREATMENT",
  "PRESCRIPTION",
  "ODONTOGRAM",
  "ATTACHMENT",
  "CONSENT",
  "REFERRAL",
  "FOLLOW_UP",
];

export interface TimelineEvent {
  id: string;
  eventType: TimelineEventType;
  visitId: string;
  title: string;
  description: string | null;
  occurredAt: string;
  actorId: string | null;
}

// docs/06-tasks/task-092.md Backend Scope literal highlight list.
export interface TimelineSummary {
  mostRecentVisit: Visit | null;
  activeAlerts: {
    medicalHistory: MedicalHistory[];
    allergies: Allergy[];
  };
  openTreatmentPlanItems: TreatmentPlanItem[];
  lastPrescription: Prescription | null;
}
