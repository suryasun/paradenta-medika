import {
  Allergy,
  Attachment,
  AttachmentAnnotation,
  AttachmentVersion,
  Consent,
  ConsentTemplate,
  FollowUp,
  MedicalCertificate,
  MedicalHistory,
  OdontogramEntry,
  PeriodontalAssessment,
  PeriodontalMeasurement,
  Prescription,
  PrescriptionItem,
  Referral,
  SoapNote,
  Treatment,
  TreatmentPlanItem,
  Visit,
  VisitDiagnosis,
  VisitTreatment,
  VisitTreatmentMaterial,
  VitalSign,
} from '@prisma/client';
import { CreateOdontogramEntryInput, IOdontogramRepository } from '../../src/modules/emr/domain/repositories/IOdontogramRepository';
import { CreateTreatmentPlanItemInput, ITreatmentPlanRepository } from '../../src/modules/emr/domain/repositories/ITreatmentPlanRepository';
import { CreateReferralInput, IReferralRepository } from '../../src/modules/emr/domain/repositories/IReferralRepository';
import { CreateFollowUpInput, IFollowUpRepository } from '../../src/modules/emr/domain/repositories/IFollowUpRepository';
import {
  AddAttachmentVersionInput,
  AttachmentWithCurrentVersion,
  CreateAttachmentInput,
  IAttachmentRepository,
} from '../../src/modules/emr/domain/repositories/IAttachmentRepository';
import {
  CreateAttachmentAnnotationInput,
  IAttachmentAnnotationRepository,
} from '../../src/modules/emr/domain/repositories/IAttachmentAnnotationRepository';
import {
  CreatePrescriptionInput,
  IPrescriptionRepository,
  PrescriptionWithItems,
} from '../../src/modules/emr/domain/repositories/IPrescriptionRepository';
import {
  CreatePeriodontalAssessmentInput,
  IPeriodontalAssessmentRepository,
} from '../../src/modules/emr/domain/repositories/IPeriodontalAssessmentRepository';
import {
  CreateConsentTemplateInput,
  IConsentTemplateRepository,
  UpdateConsentTemplateInput,
} from '../../src/modules/emr/domain/repositories/IConsentTemplateRepository';
import { CreateConsentInput, IConsentRepository, SignConsentInput } from '../../src/modules/emr/domain/repositories/IConsentRepository';
import {
  CreateMedicalCertificateInput,
  IMedicalCertificateRepository,
} from '../../src/modules/emr/domain/repositories/IMedicalCertificateRepository';
import {
  CreatePeriodontalMeasurementInput,
  IPeriodontalMeasurementRepository,
  UpdatePeriodontalMeasurementInput,
} from '../../src/modules/emr/domain/repositories/IPeriodontalMeasurementRepository';
import { CreateVisitInput, IVisitRepository } from '../../src/modules/emr/domain/repositories/IVisitRepository';
import { IVitalSignRepository, RecordVitalSignInput } from '../../src/modules/emr/domain/repositories/IVitalSignRepository';
import { ISoapNoteRepository, UpsertSoapNoteInput } from '../../src/modules/emr/domain/repositories/ISoapNoteRepository';
import { CreateVisitDiagnosisInput, IVisitDiagnosisRepository } from '../../src/modules/emr/domain/repositories/IVisitDiagnosisRepository';
import {
  CreateVisitTreatmentInput,
  DoctorFeeSourceLine,
  IVisitTreatmentRepository,
  VisitTreatmentWithMaterials,
} from '../../src/modules/emr/domain/repositories/IVisitTreatmentRepository';
import { CreateMedicalHistoryInput, IMedicalHistoryRepository } from '../../src/modules/emr/domain/repositories/IMedicalHistoryRepository';
import { CreateAllergyInput, IAllergyRepository } from '../../src/modules/emr/domain/repositories/IAllergyRepository';
import {
  CreateTreatmentInput,
  ITreatmentRepository,
  UpdateTreatmentInput,
} from '../../src/modules/master-data/domain/repositories/ITreatmentRepository';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { PagedResult } from '../../src/shared/http/pagination';
import { nextFakeUuid } from './uuid';

export class FakeVisitRepository implements IVisitRepository {
  visits = new Map<string, Visit>();

  async create(input: CreateVisitInput): Promise<Visit> {
    const visit: Visit = {
      id: nextFakeUuid(),
      visitNo: input.visitNo,
      reservationId: input.reservationId ?? null,
      patientId: input.patientId,
      doctorId: input.doctorId,
      branchId: input.branchId,
      queueId: input.queueId,
      visitDate: new Date(),
      chiefComplaint: input.chiefComplaint ?? null,
      status: 'DRAFT',
      startedAt: null,
      finishedAt: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Visit;
    this.visits.set(visit.id, visit);
    return visit;
  }

  async findById(id: string): Promise<Visit | null> {
    return this.visits.get(id) ?? null;
  }

  async findByQueueId(queueId: string): Promise<Visit | null> {
    return [...this.visits.values()].find((v) => v.queueId === queueId) ?? null;
  }

  async findByVisitNo(visitNo: string): Promise<Visit | null> {
    return [...this.visits.values()].find((v) => v.visitNo === visitNo) ?? null;
  }

  async findByPatientId(patientId: string): Promise<Visit[]> {
    return [...this.visits.values()]
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
  }

  async count(): Promise<number> {
    return this.visits.size;
  }

  async markCompleted(id: string, updatedBy: string): Promise<Visit> {
    const visit = this.visits.get(id);
    if (!visit) throw new Error('not found');
    visit.status = 'COMPLETED';
    visit.finishedAt = new Date();
    visit.updatedBy = updatedBy;
    return visit;
  }
}

export class FakeVitalSignRepository implements IVitalSignRepository {
  vitalSigns = new Map<string, VitalSign>();

  async create(input: RecordVitalSignInput): Promise<VitalSign> {
    const vitalSign: VitalSign = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      bloodPressure: input.bloodPressure ?? null,
      heartRate: input.heartRate ?? null,
      respiratoryRate: input.respiratoryRate ?? null,
      temperature: (input.temperature ?? null) as never,
      weight: (input.weight ?? null) as never,
      height: (input.height ?? null) as never,
      oxygenSaturation: input.oxygenSaturation ?? null,
      recordedAt: new Date(),
      recordedBy: input.recordedBy,
    } as VitalSign;
    this.vitalSigns.set(vitalSign.id, vitalSign);
    return vitalSign;
  }

  async findByVisitId(visitId: string): Promise<VitalSign[]> {
    return [...this.vitalSigns.values()].filter((v) => v.visitId === visitId);
  }
}

export class FakeSoapNoteRepository implements ISoapNoteRepository {
  notes = new Map<string, SoapNote>();

  async upsert(input: UpsertSoapNoteInput): Promise<SoapNote> {
    const existing = await this.findByVisitId(input.visitId);
    const note: SoapNote = {
      id: existing?.id ?? nextFakeUuid(),
      visitId: input.visitId,
      subjective: input.subjective ?? null,
      objective: input.objective ?? null,
      assessment: input.assessment ?? null,
      plan: input.plan ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
      updatedBy: input.updatedBy,
    };
    this.notes.set(note.id, note);
    return note;
  }

  async findByVisitId(visitId: string): Promise<SoapNote | null> {
    return [...this.notes.values()].find((n) => n.visitId === visitId) ?? null;
  }
}

export class FakeVisitDiagnosisRepository implements IVisitDiagnosisRepository {
  diagnoses = new Map<string, VisitDiagnosis>();

  async createMany(inputs: CreateVisitDiagnosisInput[]): Promise<VisitDiagnosis[]> {
    for (const input of inputs) {
      const diagnosis: VisitDiagnosis = {
        id: nextFakeUuid(),
        visitId: input.visitId,
        diagnosisType: input.diagnosisType,
        diagnosisName: input.diagnosisName,
        notes: input.notes ?? null,
        createdAt: new Date(),
        createdBy: input.createdBy,
      } as VisitDiagnosis;
      this.diagnoses.set(diagnosis.id, diagnosis);
    }
    return this.findByVisitId(inputs[0]?.visitId ?? '');
  }

  async findByVisitId(visitId: string): Promise<VisitDiagnosis[]> {
    return [...this.diagnoses.values()].filter((d) => d.visitId === visitId);
  }
}

export class FakeVisitTreatmentRepository implements IVisitTreatmentRepository {
  entries = new Map<string, VisitTreatment>();
  materials = new Map<string, VisitTreatmentMaterial[]>();

  async create(input: CreateVisitTreatmentInput): Promise<VisitTreatment> {
    const entry: VisitTreatment = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      treatmentId: input.treatmentId,
      toothReference: input.toothReference ?? null,
      quantity: input.quantity,
      unitPrice: input.unitPrice as never,
      subtotal: input.subtotal as never,
      notes: input.notes ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as VisitTreatment;
    this.entries.set(entry.id, entry);
    if (input.materials && input.materials.length > 0) {
      this.materials.set(
        entry.id,
        input.materials.map((m) => ({
          id: nextFakeUuid(),
          visitTreatmentId: entry.id,
          itemId: m.itemId,
          quantity: m.quantity as never,
          createdAt: new Date(),
          createdBy: input.createdBy,
        }) as VisitTreatmentMaterial),
      );
    }
    return entry;
  }

  async findByVisitId(visitId: string): Promise<VisitTreatment[]> {
    return [...this.entries.values()].filter((e) => e.visitId === visitId);
  }

  async findByVisitIdWithMaterials(visitId: string): Promise<VisitTreatmentWithMaterials[]> {
    return (await this.findByVisitId(visitId)).map((e) => ({ ...e, materials: this.materials.get(e.id) ?? [] }));
  }

  async countByVisitId(visitId: string): Promise<number> {
    return (await this.findByVisitId(visitId)).length;
  }

  /** Test-seeded source lines (no Visit/Treatment join modeled in this fake) -- Finance's Doctor Fee Settlement tests push directly into `manualDoctorFeeSources`. */
  manualDoctorFeeSources: DoctorFeeSourceLine[] = [];

  async findUnsettledDoctorFeeSources(
    _doctorId: string,
    _branchId: string,
    _periodStart: Date,
    _periodEnd: Date,
    excludeVisitTreatmentIds: string[],
  ): Promise<DoctorFeeSourceLine[]> {
    return this.manualDoctorFeeSources.filter((s) => !excludeVisitTreatmentIds.includes(s.visitTreatmentId));
  }
}

export class FakeTreatmentRepository implements ITreatmentRepository {
  treatments = new Map<string, Treatment>();

  async create(input: CreateTreatmentInput): Promise<Treatment> {
    const treatment: Treatment = {
      id: nextFakeUuid(),
      treatmentCode: input.treatmentCode,
      treatmentName: input.treatmentName,
      treatmentCategoryId: input.treatmentCategoryId,
      durationMinute: input.durationMinute ?? null,
      defaultPrice: input.defaultPrice as never,
      doctorFee: (input.doctorFee ?? null) as never,
      isActive: true,
      branchId: input.branchId ?? null,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Treatment;
    this.treatments.set(treatment.id, treatment);
    return treatment;
  }

  async list(query: ListQueryDto): Promise<PagedResult<Treatment>> {
    const all = [...this.treatments.values()];
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<Treatment | null> {
    return this.treatments.get(id) ?? null;
  }

  async findByCode(treatmentCode: string): Promise<Treatment | null> {
    return [...this.treatments.values()].find((t) => t.treatmentCode === treatmentCode) ?? null;
  }

  // Phase 4 hardening: same branch-specific-first-else-global fallback as the real repository.
  async findByCodeForBranch(treatmentCode: string, branchId: string): Promise<Treatment | null> {
    const branchSpecific = [...this.treatments.values()].find((t) => t.treatmentCode === treatmentCode && t.branchId === branchId);
    if (branchSpecific) return branchSpecific;
    return [...this.treatments.values()].find((t) => t.treatmentCode === treatmentCode && t.branchId === null) ?? null;
  }

  async existsForBranch(treatmentCode: string, branchId: string | null): Promise<boolean> {
    return [...this.treatments.values()].some((t) => t.treatmentCode === treatmentCode && t.branchId === branchId);
  }

  async update(id: string, input: UpdateTreatmentInput): Promise<Treatment> {
    const treatment = this.treatments.get(id);
    if (!treatment) throw new Error('not found');
    Object.assign(treatment, input);
    return treatment;
  }
}

export class FakeMedicalHistoryRepository implements IMedicalHistoryRepository {
  entries = new Map<string, MedicalHistory>();

  async create(input: CreateMedicalHistoryInput): Promise<MedicalHistory> {
    const entry: MedicalHistory = {
      id: nextFakeUuid(),
      patientId: input.patientId,
      visitId: input.visitId ?? null,
      category: input.category,
      description: input.description,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as MedicalHistory;
    this.entries.set(entry.id, entry);
    return entry;
  }

  async deactivateByCategory(patientId: string, category: MedicalHistory['category']): Promise<void> {
    for (const entry of this.entries.values()) {
      if (entry.patientId === patientId && entry.category === category && entry.isActive) {
        entry.isActive = false;
      }
    }
  }

  async findActiveByPatientId(patientId: string): Promise<MedicalHistory[]> {
    return [...this.entries.values()].filter((e) => e.patientId === patientId && e.isActive);
  }

  async findAllByPatientId(patientId: string): Promise<MedicalHistory[]> {
    return [...this.entries.values()].filter((e) => e.patientId === patientId);
  }
}

export class FakeAllergyRepository implements IAllergyRepository {
  entries = new Map<string, Allergy>();

  async create(input: CreateAllergyInput): Promise<Allergy> {
    const entry: Allergy = {
      id: nextFakeUuid(),
      patientId: input.patientId,
      visitId: input.visitId ?? null,
      type: input.type,
      allergen: input.allergen,
      severity: input.severity,
      reaction: input.reaction ?? null,
      notes: input.notes ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as Allergy;
    this.entries.set(entry.id, entry);
    return entry;
  }

  async findByPatientId(patientId: string): Promise<Allergy[]> {
    return [...this.entries.values()].filter((e) => e.patientId === patientId);
  }
}

let odontogramEntrySequence = 0;

export class FakeOdontogramRepository implements IOdontogramRepository {
  entries: OdontogramEntry[] = [];

  async create(input: CreateOdontogramEntryInput): Promise<OdontogramEntry> {
    odontogramEntrySequence += 1;
    const entry: OdontogramEntry = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      patientId: input.patientId,
      toothNumber: input.toothNumber,
      surface: input.surface ?? null,
      toothConditionId: input.toothConditionId,
      note: input.note ?? null,
      // Monotonic offset avoids same-millisecond createdAt ties when a test
      // records several entries back-to-back within one tick.
      createdAt: new Date(Date.now() + odontogramEntrySequence),
      createdBy: input.createdBy,
    } as OdontogramEntry;
    this.entries.push(entry);
    return entry;
  }

  async findAllByPatientId(patientId: string): Promise<OdontogramEntry[]> {
    return this.entries.filter((e) => e.patientId === patientId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByPatientIdAndTooth(patientId: string, toothNumber: number): Promise<OdontogramEntry[]> {
    return this.entries
      .filter((e) => e.patientId === patientId && e.toothNumber === toothNumber)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export class FakeTreatmentPlanRepository implements ITreatmentPlanRepository {
  items = new Map<string, TreatmentPlanItem>();
  convertedItemIds = new Set<string>();

  async createMany(inputs: CreateTreatmentPlanItemInput[]): Promise<TreatmentPlanItem[]> {
    const created: TreatmentPlanItem[] = [];
    for (const input of inputs) {
      const item: TreatmentPlanItem = {
        id: nextFakeUuid(),
        visitId: input.visitId,
        patientId: input.patientId,
        treatmentId: input.treatmentId,
        toothNumber: input.toothNumber ?? null,
        surface: input.surface ?? null,
        priority: input.priority ?? 'MEDIUM',
        estimatedCost: input.estimatedCost as never,
        estimatedDurationMinute: input.estimatedDurationMinute ?? null,
        createdAt: new Date(),
        createdBy: input.createdBy,
      } as TreatmentPlanItem;
      this.items.set(item.id, item);
      created.push(item);
    }
    return created;
  }

  async findById(id: string): Promise<TreatmentPlanItem | null> {
    return this.items.get(id) ?? null;
  }

  async findByVisitId(visitId: string): Promise<TreatmentPlanItem[]> {
    return [...this.items.values()].filter((i) => i.visitId === visitId);
  }

  async findOpenByPatientId(patientId: string): Promise<TreatmentPlanItem[]> {
    return [...this.items.values()].filter((i) => i.patientId === patientId && !this.convertedItemIds.has(i.id));
  }
}

export class FakePeriodontalAssessmentRepository implements IPeriodontalAssessmentRepository {
  assessments = new Map<string, PeriodontalAssessment>();

  async create(input: CreatePeriodontalAssessmentInput): Promise<PeriodontalAssessment> {
    const assessment: PeriodontalAssessment = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      status: 'DRAFT',
      lockedAt: null,
      lockedBy: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
    } as PeriodontalAssessment;
    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  async findById(id: string): Promise<PeriodontalAssessment | null> {
    return this.assessments.get(id) ?? null;
  }

  async findByPatientId(patientId: string): Promise<PeriodontalAssessment[]> {
    return [...this.assessments.values()]
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async lock(id: string, lockedBy: string): Promise<PeriodontalAssessment> {
    const assessment = this.assessments.get(id);
    if (!assessment) throw new Error('not found');
    assessment.status = 'LOCKED';
    assessment.lockedAt = new Date();
    assessment.lockedBy = lockedBy;
    return assessment;
  }
}

export class FakePeriodontalMeasurementRepository implements IPeriodontalMeasurementRepository {
  measurements = new Map<string, PeriodontalMeasurement>();

  async create(input: CreatePeriodontalMeasurementInput): Promise<PeriodontalMeasurement> {
    const measurement: PeriodontalMeasurement = {
      id: nextFakeUuid(),
      assessmentId: input.assessmentId,
      toothNumber: input.toothNumber,
      measurementPoint: input.measurementPoint,
      pocketDepth: input.pocketDepth as never,
      gingivalMargin: input.gingivalMargin as never,
      cal: input.cal as never,
      bleeding: input.bleeding,
      plaqueIndex: input.plaqueIndex ?? null,
      mobility: input.mobility ?? null,
      furcation: input.furcation ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as PeriodontalMeasurement;
    this.measurements.set(measurement.id, measurement);
    return measurement;
  }

  async findById(id: string): Promise<PeriodontalMeasurement | null> {
    const measurement = this.measurements.get(id);
    return measurement && !measurement.deletedAt ? measurement : null;
  }

  async findByAssessmentId(assessmentId: string): Promise<PeriodontalMeasurement[]> {
    return [...this.measurements.values()].filter((m) => m.assessmentId === assessmentId && !m.deletedAt);
  }

  async update(id: string, input: UpdatePeriodontalMeasurementInput): Promise<PeriodontalMeasurement> {
    const measurement = this.measurements.get(id);
    if (!measurement) throw new Error('not found');
    if (input.toothNumber !== undefined) measurement.toothNumber = input.toothNumber;
    if (input.measurementPoint !== undefined) measurement.measurementPoint = input.measurementPoint;
    if (input.pocketDepth !== undefined) measurement.pocketDepth = input.pocketDepth as never;
    if (input.gingivalMargin !== undefined) measurement.gingivalMargin = input.gingivalMargin as never;
    if (input.cal !== undefined) measurement.cal = input.cal as never;
    if (input.bleeding !== undefined) measurement.bleeding = input.bleeding;
    if (input.plaqueIndex !== undefined) measurement.plaqueIndex = input.plaqueIndex;
    if (input.mobility !== undefined) measurement.mobility = input.mobility;
    if (input.furcation !== undefined) measurement.furcation = input.furcation;
    measurement.updatedBy = input.updatedBy;
    return measurement;
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    const measurement = this.measurements.get(id);
    if (!measurement) throw new Error('not found');
    measurement.deletedAt = new Date();
    measurement.deletedBy = deletedBy;
  }
}

export class FakeReferralRepository implements IReferralRepository {
  referrals = new Map<string, Referral>();

  async create(input: CreateReferralInput): Promise<Referral> {
    const referral: Referral = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      patientId: input.patientId,
      targetType: input.targetType,
      reason: input.reason,
      note: input.note ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as Referral;
    this.referrals.set(referral.id, referral);
    return referral;
  }

  async findByVisitId(visitId: string): Promise<Referral[]> {
    return [...this.referrals.values()].filter((r) => r.visitId === visitId);
  }
}

export class FakeFollowUpRepository implements IFollowUpRepository {
  followUps = new Map<string, FollowUp>();

  async create(input: CreateFollowUpInput): Promise<FollowUp> {
    const followUp: FollowUp = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      patientId: input.patientId,
      followUpDate: input.followUpDate,
      note: input.note ?? null,
      priority: input.priority ?? 'MEDIUM',
      reservationId: input.reservationId ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as FollowUp;
    this.followUps.set(followUp.id, followUp);
    return followUp;
  }

  async findByVisitId(visitId: string): Promise<FollowUp[]> {
    return [...this.followUps.values()].filter((f) => f.visitId === visitId);
  }
}

export class FakeAttachmentRepository implements IAttachmentRepository {
  attachments = new Map<string, Attachment>();
  versions = new Map<string, AttachmentVersion>();

  private withCurrentVersion(attachment: Attachment): AttachmentWithCurrentVersion {
    const currentVersion = attachment.currentVersionId ? (this.versions.get(attachment.currentVersionId) ?? null) : null;
    return { ...attachment, currentVersion };
  }

  async createWithFirstVersion(input: CreateAttachmentInput): Promise<AttachmentWithCurrentVersion> {
    const attachment: Attachment = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      patientId: input.patientId,
      category: input.category,
      attachmentType: input.attachmentType ?? null,
      currentVersionId: null,
      archivedAt: null,
      archivedBy: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as Attachment;
    const version: AttachmentVersion = {
      id: nextFakeUuid(),
      attachmentId: attachment.id,
      versionNumber: 1,
      fileName: input.file.fileName,
      storedName: input.file.storedName,
      extension: input.file.extension,
      mimeType: input.file.mimeType,
      fileSize: input.file.fileSize,
      bucket: input.file.bucket,
      objectKey: input.file.objectKey,
      checksum: input.file.checksum,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as AttachmentVersion;
    attachment.currentVersionId = version.id;
    this.attachments.set(attachment.id, attachment);
    this.versions.set(version.id, version);
    return this.withCurrentVersion(attachment);
  }

  async addVersion(input: AddAttachmentVersionInput): Promise<AttachmentWithCurrentVersion> {
    const attachment = this.attachments.get(input.attachmentId);
    if (!attachment) throw new Error('not found');
    const existingVersions = [...this.versions.values()].filter((v) => v.attachmentId === input.attachmentId);
    const nextVersionNumber = existingVersions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;
    const version: AttachmentVersion = {
      id: nextFakeUuid(),
      attachmentId: input.attachmentId,
      versionNumber: nextVersionNumber,
      fileName: input.file.fileName,
      storedName: input.file.storedName,
      extension: input.file.extension,
      mimeType: input.file.mimeType,
      fileSize: input.file.fileSize,
      bucket: input.file.bucket,
      objectKey: input.file.objectKey,
      checksum: input.file.checksum,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as AttachmentVersion;
    this.versions.set(version.id, version);
    attachment.currentVersionId = version.id;
    return this.withCurrentVersion(attachment);
  }

  async findById(id: string): Promise<AttachmentWithCurrentVersion | null> {
    const attachment = this.attachments.get(id);
    return attachment ? this.withCurrentVersion(attachment) : null;
  }

  async findByVisitId(visitId: string, includeArchived: boolean): Promise<AttachmentWithCurrentVersion[]> {
    return [...this.attachments.values()]
      .filter((a) => a.visitId === visitId && (includeArchived || !a.archivedAt))
      .map((a) => this.withCurrentVersion(a));
  }

  async findByPatientId(patientId: string, includeArchived: boolean): Promise<AttachmentWithCurrentVersion[]> {
    return [...this.attachments.values()]
      .filter((a) => a.patientId === patientId && (includeArchived || !a.archivedAt))
      .map((a) => this.withCurrentVersion(a));
  }

  async archive(id: string, archivedBy: string): Promise<Attachment> {
    const attachment = this.attachments.get(id);
    if (!attachment) throw new Error('not found');
    attachment.archivedAt = new Date();
    attachment.archivedBy = archivedBy;
    return attachment;
  }

  async findVersions(attachmentId: string): Promise<AttachmentVersion[]> {
    return [...this.versions.values()].filter((v) => v.attachmentId === attachmentId).sort((a, b) => a.versionNumber - b.versionNumber);
  }

  async findVersionByNumber(attachmentId: string, versionNumber: number): Promise<AttachmentVersion | null> {
    return (
      [...this.versions.values()].find((v) => v.attachmentId === attachmentId && v.versionNumber === versionNumber) ?? null
    );
  }

  async setCurrentVersion(attachmentId: string, versionId: string): Promise<AttachmentWithCurrentVersion> {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment) throw new Error('not found');
    attachment.currentVersionId = versionId;
    return this.withCurrentVersion(attachment);
  }
}

export class FakeAttachmentAnnotationRepository implements IAttachmentAnnotationRepository {
  annotations = new Map<string, AttachmentAnnotation>();

  async create(input: CreateAttachmentAnnotationInput): Promise<AttachmentAnnotation> {
    const annotation: AttachmentAnnotation = {
      id: nextFakeUuid(),
      attachmentId: input.attachmentId,
      shape: input.shape,
      positionX: input.positionX,
      positionY: input.positionY,
      width: input.width ?? null,
      height: input.height ?? null,
      text: input.text ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as AttachmentAnnotation;
    this.annotations.set(annotation.id, annotation);
    return annotation;
  }

  async findByAttachmentId(attachmentId: string): Promise<AttachmentAnnotation[]> {
    return [...this.annotations.values()].filter((a) => a.attachmentId === attachmentId);
  }
}

export class FakePrescriptionRepository implements IPrescriptionRepository {
  prescriptions = new Map<string, Prescription>();
  items = new Map<string, PrescriptionItem[]>();

  private withItems(prescription: Prescription): PrescriptionWithItems {
    return { ...prescription, items: this.items.get(prescription.id) ?? [] };
  }

  async create(input: CreatePrescriptionInput): Promise<PrescriptionWithItems> {
    const prescription: Prescription = {
      id: nextFakeUuid(),
      visitId: input.visitId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as Prescription;
    const items: PrescriptionItem[] = input.items.map(
      (item) =>
        ({
          id: nextFakeUuid(),
          prescriptionId: prescription.id,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instruction: item.instruction ?? null,
          createdAt: new Date(),
        }) as PrescriptionItem,
    );
    this.prescriptions.set(prescription.id, prescription);
    this.items.set(prescription.id, items);
    return this.withItems(prescription);
  }

  async findById(id: string): Promise<PrescriptionWithItems | null> {
    const prescription = this.prescriptions.get(id);
    return prescription ? this.withItems(prescription) : null;
  }

  async findByPatientId(patientId: string): Promise<PrescriptionWithItems[]> {
    return [...this.prescriptions.values()]
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((p) => this.withItems(p));
  }
}

export class FakeConsentTemplateRepository implements IConsentTemplateRepository {
  templates = new Map<string, ConsentTemplate>();

  async create(input: CreateConsentTemplateInput): Promise<ConsentTemplate> {
    const template: ConsentTemplate = {
      id: nextFakeUuid(),
      category: input.category,
      title: input.title,
      body: input.body,
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as ConsentTemplate;
    this.templates.set(template.id, template);
    return template;
  }

  async list(query: ListQueryDto): Promise<PagedResult<ConsentTemplate>> {
    const all = [...this.templates.values()];
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<ConsentTemplate | null> {
    return this.templates.get(id) ?? null;
  }

  async update(id: string, input: UpdateConsentTemplateInput): Promise<ConsentTemplate> {
    const template = this.templates.get(id);
    if (!template) throw new Error('not found');
    Object.assign(template, input);
    return template;
  }
}

export class FakeConsentRepository implements IConsentRepository {
  consents = new Map<string, Consent>();

  async create(input: CreateConsentInput): Promise<Consent> {
    const consent: Consent = {
      id: nextFakeUuid(),
      templateId: input.templateId,
      patientId: input.patientId,
      visitId: input.visitId,
      doctorId: input.doctorId,
      procedure: input.procedure,
      signedAt: null,
      signerName: null,
      signerRelationship: null,
      signatureData: null,
      hash: null,
      signedAttachmentId: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as Consent;
    this.consents.set(consent.id, consent);
    return consent;
  }

  async findById(id: string): Promise<Consent | null> {
    return this.consents.get(id) ?? null;
  }

  async findByPatientId(patientId: string): Promise<Consent[]> {
    return [...this.consents.values()]
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async sign(id: string, input: SignConsentInput): Promise<Consent> {
    const consent = this.consents.get(id);
    if (!consent) throw new Error('not found');
    consent.signedAt = new Date();
    consent.signerName = input.signerName;
    consent.signerRelationship = input.signerRelationship;
    consent.signatureData = input.signatureData;
    consent.hash = input.hash;
    consent.signedAttachmentId = input.signedAttachmentId;
    return consent;
  }
}

export class FakeMedicalCertificateRepository implements IMedicalCertificateRepository {
  certificates = new Map<string, MedicalCertificate>();

  async create(input: CreateMedicalCertificateInput): Promise<MedicalCertificate> {
    const certificate: MedicalCertificate = {
      id: nextFakeUuid(),
      certificateNumber: input.certificateNumber,
      visitId: input.visitId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      certificateType: input.certificateType,
      content: input.content,
      issuedAt: new Date(),
      attachmentId: input.attachmentId,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as MedicalCertificate;
    this.certificates.set(certificate.id, certificate);
    return certificate;
  }

  async findById(id: string): Promise<MedicalCertificate | null> {
    return this.certificates.get(id) ?? null;
  }

  async findByCertificateNumber(certificateNumber: string): Promise<MedicalCertificate | null> {
    return [...this.certificates.values()].find((c) => c.certificateNumber === certificateNumber) ?? null;
  }

  async findByPatientId(patientId: string): Promise<MedicalCertificate[]> {
    return [...this.certificates.values()]
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime());
  }

  async count(): Promise<number> {
    return this.certificates.size;
  }
}
