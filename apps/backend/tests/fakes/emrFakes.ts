import { SoapNote, Treatment, Visit, VisitDiagnosis, VisitTreatment, VitalSign } from '@prisma/client';
import { CreateVisitInput, IVisitRepository } from '../../src/modules/emr/domain/repositories/IVisitRepository';
import { IVitalSignRepository, RecordVitalSignInput } from '../../src/modules/emr/domain/repositories/IVitalSignRepository';
import { ISoapNoteRepository, UpsertSoapNoteInput } from '../../src/modules/emr/domain/repositories/ISoapNoteRepository';
import { CreateVisitDiagnosisInput, IVisitDiagnosisRepository } from '../../src/modules/emr/domain/repositories/IVisitDiagnosisRepository';
import { CreateVisitTreatmentInput, IVisitTreatmentRepository } from '../../src/modules/emr/domain/repositories/IVisitTreatmentRepository';
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
    return entry;
  }

  async findByVisitId(visitId: string): Promise<VisitTreatment[]> {
    return [...this.entries.values()].filter((e) => e.visitId === visitId);
  }

  async countByVisitId(visitId: string): Promise<number> {
    return (await this.findByVisitId(visitId)).length;
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

  async update(id: string, input: UpdateTreatmentInput): Promise<Treatment> {
    const treatment = this.treatments.get(id);
    if (!treatment) throw new Error('not found');
    Object.assign(treatment, input);
    return treatment;
  }
}
