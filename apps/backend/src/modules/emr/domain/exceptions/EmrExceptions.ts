import { BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

export class VisitNotFoundException extends NotFoundException {
  constructor() {
    super('Visit not found');
  }
}

/** docs/03-sad/15-module-emr.md Section 15: "Visit hanya dapat dibuat dari Queue berstatus Called." */
export class QueueNotCalledException extends BusinessException {
  constructor() {
    super('QUEUE_NOT_CALLED', 'Visit can only be opened from a queue in CALLED status');
  }
}

/** Section 15: "Satu Queue hanya dapat memiliki satu Visit." */
export class QueueAlreadyHasVisitException extends ConflictException {
  constructor() {
    super('Queue already has a visit', 'QUEUE_ALREADY_HAS_VISIT');
  }
}

/** Clinical documentation can only be recorded while the Visit is open (not Completed/Locked/Archived). */
export class VisitNotOpenException extends BusinessException {
  constructor() {
    super('VISIT_NOT_OPEN', 'Visit is not open for documentation');
  }
}

/** Section 15: "Visit tidak dapat dihapus setelah Completed." */
export class VisitAlreadyCompletedException extends BusinessException {
  constructor() {
    super('VISIT_ALREADY_COMPLETED', 'Visit has already been completed');
  }
}

/** docs/06-tasks/task-025.md: a deactivated Treatment catalog item cannot be selected. */
export class TreatmentNotActiveException extends BusinessException {
  constructor() {
    super('TREATMENT_NOT_ACTIVE', 'Treatment catalog item is not active');
  }
}

/**
 * docs/06-tasks/task-317.md: Treatment entries cannot be recorded/edited
 * once the Visit's linked Invoice is fully paid -- independent of the
 * Visit's own status (a COMPLETED-but-unpaid visit's Treatment stays
 * editable per task-316; this is the stricter, payment-driven gate).
 */
export class TreatmentLockedException extends BusinessException {
  constructor() {
    super('TREATMENT_LOCKED', 'Treatment can no longer be edited: the linked invoice has already been paid');
  }
}

/**
 * docs/06-tasks/task-052.md: minimum documentation (SOAP note + at least
 * one Treatment entry) is required before a Visit can be closed.
 */
export class MinimumDocumentationException extends BusinessException {
  constructor(reasons: string[]) {
    super('MINIMUM_DOCUMENTATION_NOT_MET', `Visit cannot be closed: ${reasons.join('; ')}`);
  }
}

/** docs/03-sad/15-module-emr.md Part 3.1B Section 20: "Nomor FDI harus valid." */
export class InvalidToothNumberException extends BusinessException {
  constructor() {
    super('INVALID_TOOTH_NUMBER', 'Tooth number is not a valid FDI notation number');
  }
}

/** docs/03-sad/15-module-emr.md Part 3.1B Section 20: "Surface harus sesuai tipe gigi." */
export class InvalidSurfaceCombinationException extends BusinessException {
  constructor() {
    super('INVALID_SURFACE_COMBINATION', 'Surface combination is invalid (must be a non-empty, non-repeating set of M/D/B/L/O/I)');
  }
}

/** docs/06-tasks/task-068.md: a deactivated Tooth Condition cannot be selected. */
export class ToothConditionNotActiveException extends BusinessException {
  constructor() {
    super('TOOTH_CONDITION_NOT_ACTIVE', 'Tooth Condition catalog item is not active');
  }
}

export class TreatmentPlanItemNotFoundException extends NotFoundException {
  constructor() {
    super('Treatment Plan item not found');
  }
}

export class AttachmentNotFoundException extends NotFoundException {
  constructor() {
    super('Attachment not found');
  }
}

/** docs/06-tasks/task-084.md: restoring a non-existent version must be rejected. */
export class AttachmentVersionNotFoundException extends NotFoundException {
  constructor() {
    super('Attachment version not found');
  }
}

/** docs/03-sad/15-module-emr.md Part 3.3A Section 5 Attachment Matrix: annotation is not supported for every category. */
export class AnnotationNotSupportedException extends BusinessException {
  constructor() {
    super('ANNOTATION_NOT_SUPPORTED', 'This attachment category does not support annotation');
  }
}

/**
 * docs/03-sad/15-module-emr.md Part 3.2D Section 40 names a literal
 * `ASSESSMENT_NOT_FOUND` code, but NotFoundException's `code` is fixed to
 * `NOT_FOUND` codebase-wide (see PatientNotFoundException/
 * VisitNotFoundException) -- kept consistent with that established
 * convention rather than special-casing this one entity.
 */
export class PeriodontalAssessmentNotFoundException extends NotFoundException {
  constructor() {
    super('Periodontal assessment not found');
  }
}

/** docs/03-sad/15-module-emr.md Part 3.2D Section 40 "Business Error" -- literal error code. */
export class PeriodontalAssessmentLockedException extends BusinessException {
  constructor() {
    super('ASSESSMENT_LOCKED', 'Assessment already locked');
  }
}

export class PeriodontalMeasurementNotFoundException extends NotFoundException {
  constructor() {
    super('Periodontal measurement not found');
  }
}

/** docs/03-sad/15-module-emr.md Part 3.2B Section 18: "Tidak berlaku pada gigi satu akar." */
export class FurcationNotApplicableException extends BusinessException {
  constructor() {
    super('FURCATION_NOT_APPLICABLE', 'Furcation grade only applies to multiroot (molar) teeth');
  }
}

/**
 * docs/06-tasks/task-065.md Section 24: "Prescription harus divalidasi
 * terhadap Allergy." Hard block, per explicit user sign-off (the SAD does
 * not specify block-vs-override) -- no override path exists.
 */
export class PrescriptionAllergyConflictException extends BusinessException {
  constructor(medicineName: string, allergen: string) {
    super(
      'PRESCRIPTION_ALLERGY_CONFLICT',
      `Cannot prescribe "${medicineName}": patient has a recorded Drug allergy to "${allergen}"`,
    );
  }
}

export class PrescriptionNotFoundException extends NotFoundException {
  constructor() {
    super('Prescription not found');
  }
}

export class ConsentNotFoundException extends NotFoundException {
  constructor() {
    super('Consent not found');
  }
}

/** docs/03-sad/15-module-emr.md Part 3.3D Section 48: "Setelah ditandatangani, consent tidak dapat diubah." */
export class ConsentAlreadySignedException extends BusinessException {
  constructor() {
    super('CONSENT_ALREADY_SIGNED', 'Consent has already been signed and cannot be modified or re-signed');
  }
}

export class ConsentTemplateNotActiveException extends BusinessException {
  constructor() {
    super('CONSENT_TEMPLATE_NOT_ACTIVE', 'Consent template is not active');
  }
}

/** docs/03-sad/15-module-emr.md Section 25 Business Rules: "Hanya Doctor yang dapat menerbitkan." */
export class OnlyDoctorCanIssueCertificateException extends BusinessException {
  constructor() {
    super('ONLY_DOCTOR_CAN_ISSUE_CERTIFICATE', 'Only a Doctor can issue a Medical Certificate');
  }
}

export class MedicalCertificateNotFoundException extends NotFoundException {
  constructor() {
    super('Medical certificate not found');
  }
}
