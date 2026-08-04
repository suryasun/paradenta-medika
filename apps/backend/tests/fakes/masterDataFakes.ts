import { Branch, Clinic, Doctor, MasterDataTemplate, MasterDataTemplateBranchLink, ToothCondition } from '@prisma/client';
import { CreateClinicInput, IClinicRepository, UpdateClinicInput } from '../../src/modules/master-data/domain/repositories/IClinicRepository';
import { CreateBranchInput, IBranchRepository, UpdateBranchInput } from '../../src/modules/master-data/domain/repositories/IBranchRepository';
import {
  CreateMasterDataTemplateInput,
  IMasterDataTemplateRepository,
  UpdateMasterDataTemplateInput,
} from '../../src/modules/master-data/domain/repositories/IMasterDataTemplateRepository';
import {
  CreateMasterDataTemplateBranchLinkInput,
  IMasterDataTemplateBranchLinkRepository,
} from '../../src/modules/master-data/domain/repositories/IMasterDataTemplateBranchLinkRepository';
import { CreateDoctorInput, IDoctorRepository, UpdateDoctorInput } from '../../src/modules/master-data/domain/repositories/IDoctorRepository';
import {
  CreateToothConditionInput,
  IToothConditionRepository,
  UpdateToothConditionInput,
} from '../../src/modules/master-data/domain/repositories/IToothConditionRepository';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { PagedResult } from '../../src/shared/http/pagination';
import { nextFakeUuid } from './uuid';

function nextId(_prefix: string): string {
  return nextFakeUuid();
}

function paginate<T>(items: T[], query: ListQueryDto): PagedResult<T> {
  const start = (query.page - 1) * query.limit;
  return { items: items.slice(start, start + query.limit), total: items.length };
}

export class FakeClinicRepository implements IClinicRepository {
  clinics = new Map<string, Clinic>();

  async create(input: CreateClinicInput): Promise<Clinic> {
    const clinic = { id: nextId('clinic'), ...input, ownerName: input.ownerName ?? null, isActive: true, createdAt: new Date(), createdBy: null, updatedAt: new Date(), updatedBy: null, deletedAt: null, deletedBy: null } as Clinic;
    this.clinics.set(clinic.id, clinic);
    return clinic;
  }

  async list(query: ListQueryDto): Promise<PagedResult<Clinic>> {
    return paginate([...this.clinics.values()], query);
  }

  async findById(id: string): Promise<Clinic | null> {
    return this.clinics.get(id) ?? null;
  }

  async findByCode(clinicCode: string): Promise<Clinic | null> {
    return [...this.clinics.values()].find((c) => c.clinicCode === clinicCode) ?? null;
  }

  async update(id: string, input: UpdateClinicInput): Promise<Clinic> {
    const clinic = this.clinics.get(id);
    if (!clinic) throw new Error('not found');
    Object.assign(clinic, input);
    return clinic;
  }
}

export class FakeBranchRepository implements IBranchRepository {
  branches = new Map<string, Branch>();

  async create(input: CreateBranchInput): Promise<Branch> {
    const branch = {
      id: nextId('branch'),
      clinicId: input.clinicId,
      branchCode: input.branchCode,
      branchName: input.branchName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      timezone: input.timezone ?? 'Asia/Jakarta',
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Branch;
    this.branches.set(branch.id, branch);
    return branch;
  }

  async list(query: ListQueryDto): Promise<PagedResult<Branch>> {
    return paginate([...this.branches.values()], query);
  }

  async findById(id: string): Promise<Branch | null> {
    return this.branches.get(id) ?? null;
  }

  async findByCode(branchCode: string): Promise<Branch | null> {
    return [...this.branches.values()].find((b) => b.branchCode === branchCode) ?? null;
  }

  async update(id: string, input: UpdateBranchInput): Promise<Branch> {
    const branch = this.branches.get(id);
    if (!branch) throw new Error('not found');
    Object.assign(branch, input);
    return branch;
  }
}

export class FakeMasterDataTemplateRepository implements IMasterDataTemplateRepository {
  templates = new Map<string, MasterDataTemplate>();

  async create(input: CreateMasterDataTemplateInput): Promise<MasterDataTemplate> {
    const template = {
      id: nextId('template'),
      entityType: input.entityType,
      templatePayload: input.templatePayload,
      version: 1,
      ownerClinicId: input.ownerClinicId,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
    } as unknown as MasterDataTemplate;
    this.templates.set(template.id, template);
    return template;
  }

  async list(query: ListQueryDto): Promise<PagedResult<MasterDataTemplate>> {
    return paginate([...this.templates.values()], query);
  }

  async findById(id: string): Promise<MasterDataTemplate | null> {
    return this.templates.get(id) ?? null;
  }

  async update(id: string, input: UpdateMasterDataTemplateInput): Promise<MasterDataTemplate> {
    const template = this.templates.get(id);
    if (!template) throw new Error('not found');
    if (input.templatePayload) {
      template.templatePayload = input.templatePayload as never;
      template.version += 1;
    }
    return template;
  }
}

export class FakeMasterDataTemplateBranchLinkRepository implements IMasterDataTemplateBranchLinkRepository {
  links = new Map<string, MasterDataTemplateBranchLink>();

  async findByTemplateAndBranch(templateId: string, branchId: string): Promise<MasterDataTemplateBranchLink | null> {
    return [...this.links.values()].find((l) => l.templateId === templateId && l.branchId === branchId) ?? null;
  }

  async listByTemplate(templateId: string): Promise<MasterDataTemplateBranchLink[]> {
    return [...this.links.values()].filter((l) => l.templateId === templateId);
  }

  async create(input: CreateMasterDataTemplateBranchLinkInput): Promise<MasterDataTemplateBranchLink> {
    const link = {
      id: nextId('template-link'),
      templateId: input.templateId,
      branchId: input.branchId,
      pushedVersion: input.pushedVersion,
      snapshotPayload: input.snapshotPayload,
      currentPayload: input.currentPayload,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as MasterDataTemplateBranchLink;
    this.links.set(link.id, link);
    return link;
  }

  async overwriteWithPush(id: string, pushedVersion: number, payload: Record<string, unknown>): Promise<MasterDataTemplateBranchLink> {
    const link = this.links.get(id);
    if (!link) throw new Error('not found');
    link.pushedVersion = pushedVersion;
    link.snapshotPayload = payload as never;
    link.currentPayload = payload as never;
    return link;
  }

  /** Test-only helper: simulates a branch having locally edited its synced record outside of any push, since no such write endpoint exists in this phase's scope. */
  simulateLocalEdit(id: string, payload: Record<string, unknown>): void {
    const link = this.links.get(id);
    if (!link) throw new Error('not found');
    link.currentPayload = payload as never;
  }
}

export class FakeDoctorRepository implements IDoctorRepository {
  doctors = new Map<string, Doctor>();

  async create(input: CreateDoctorInput): Promise<Doctor> {
    const doctor = {
      id: nextId('doctor'),
      doctorCode: input.doctorCode,
      userId: input.userId,
      branchId: input.branchId,
      fullName: input.fullName,
      sipNumber: input.sipNumber ?? null,
      strNumber: input.strNumber ?? null,
      specialization: input.specialization ?? null,
      consultationFee: input.consultationFee ?? null,
      joinDate: input.joinDate ? new Date(input.joinDate) : null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as unknown as Doctor;
    this.doctors.set(doctor.id, doctor);
    return doctor;
  }

  async list(query: ListQueryDto): Promise<PagedResult<Doctor>> {
    return paginate([...this.doctors.values()], query);
  }

  async findById(id: string): Promise<Doctor | null> {
    return this.doctors.get(id) ?? null;
  }

  async findByCode(doctorCode: string): Promise<Doctor | null> {
    return [...this.doctors.values()].find((d) => d.doctorCode === doctorCode) ?? null;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    return [...this.doctors.values()].find((d) => d.userId === userId) ?? null;
  }

  async update(id: string, input: UpdateDoctorInput): Promise<Doctor> {
    const doctor = this.doctors.get(id);
    if (!doctor) throw new Error('not found');
    Object.assign(doctor, input);
    return doctor;
  }
}

export class FakeToothConditionRepository implements IToothConditionRepository {
  conditions = new Map<string, ToothCondition>();

  async create(input: CreateToothConditionInput): Promise<ToothCondition> {
    const condition: ToothCondition = {
      id: nextId('tooth-condition'),
      conditionCode: input.conditionCode,
      conditionName: input.conditionName,
      category: input.category,
      colorCode: input.colorCode ?? null,
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as ToothCondition;
    this.conditions.set(condition.id, condition);
    return condition;
  }

  async list(query: ListQueryDto): Promise<PagedResult<ToothCondition>> {
    return paginate([...this.conditions.values()], query);
  }

  async findById(id: string): Promise<ToothCondition | null> {
    return this.conditions.get(id) ?? null;
  }

  async findByCode(conditionCode: string): Promise<ToothCondition | null> {
    return [...this.conditions.values()].find((c) => c.conditionCode === conditionCode) ?? null;
  }

  async update(id: string, input: UpdateToothConditionInput): Promise<ToothCondition> {
    const condition = this.conditions.get(id);
    if (!condition) throw new Error('not found');
    Object.assign(condition, input);
    return condition;
  }
}
