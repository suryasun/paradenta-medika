import { Patient, PatientIdentityType, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { PatientProps } from '../../domain/entities/PatientEntity';
import { IPatientRepository, PatientListFilters, UpdatePatientProps } from '../../domain/repositories/IPatientRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'patientName', 'birthDate', 'medicalRecordNo'] as const;

// task-287: switched from Prisma.PatientCreateInput (which, once
// referralSourceId/referredByUserId became relation-backed FKs, only
// accepts the nested `{ connect: { id } }` shape) to the Unchecked variant
// so this function can keep passing raw scalar FKs directly, matching
// PatientAddressRepository's own precedent -- prisma.patient.create()'s
// `data` param accepts either shape.
function toCreateData(medicalRecordNo: string, props: PatientProps): Prisma.PatientUncheckedCreateInput {
  return {
    medicalRecordNo,
    patientName: props.patientName,
    gender: props.gender,
    birthDate: props.birthDate,
    birthPlace: props.birthPlace,
    identityType: props.identityType,
    identityNumber: props.identityNumber,
    phone: props.phone,
    email: props.email,
    address: props.address,
    insuranceNumber: props.insuranceNumber,
    instagramHandle: props.instagramHandle,
    facebookHandle: props.facebookHandle,
    tiktokHandle: props.tiktokHandle,
    whatsappNumber: props.whatsappNumber,
    referralSourceId: props.referralSourceId,
    referredByUserId: props.referredByUserId,
  };
}

export class PatientRepository implements IPatientRepository {
  async findById(id: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { id, deletedAt: null } });
  }

  async findByMRN(medicalRecordNo: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { medicalRecordNo, deletedAt: null } });
  }

  async findByIdentityNumber(identityType: string, identityNumber: string): Promise<Patient | null> {
    return prisma.patient.findFirst({
      where: { identityType: identityType as PatientIdentityType, identityNumber, deletedAt: null },
    });
  }

  async search(filters: PatientListFilters): Promise<PagedResult<Patient>> {
    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { patientName: { contains: filters.search } },
              { medicalRecordNo: { contains: filters.search } },
              { phone: { contains: filters.search } },
              { identityNumber: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.gender ? { gender: filters.gender } : {}),
      // docs/06-tasks/task-030.md AC: archived patients are excluded from
      // the default list; an explicit status filter can still request them.
      active: filters.status ? filters.status === 'ACTIVE' : true,
    };

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { [sanitizeSortField(filters.sort, ALLOWED_SORT_FIELDS)]: filters.order },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.patient.count({ where }),
    ]);

    return { items, total };
  }

  async create(medicalRecordNo: string, props: PatientProps): Promise<Patient> {
    return prisma.patient.create({ data: toCreateData(medicalRecordNo, props) });
  }

  async update(id: string, props: UpdatePatientProps): Promise<Patient> {
    return prisma.patient.update({
      where: { id },
      data: {
        patientName: props.patientName,
        gender: props.gender,
        birthDate: props.birthDate,
        phone: props.phone,
        email: props.email,
        address: props.address,
        insuranceNumber: props.insuranceNumber,
        instagramHandle: props.instagramHandle,
        facebookHandle: props.facebookHandle,
        tiktokHandle: props.tiktokHandle,
        whatsappNumber: props.whatsappNumber,
        referralSourceId: props.referralSourceId,
        referredByUserId: props.referredByUserId,
      },
    });
  }

  async archive(id: string): Promise<Patient> {
    // docs/06-tasks/task-030.md AC: archived history "remains intact and
    // accessible via direct detail lookup" -- so this flips `active` only
    // and deliberately does NOT set `deleted_at` (that column is reserved
    // for the stricter Soft Delete rule in Section 5.1, which additionally
    // requires no clinical transaction history and is not implemented by
    // any Phase 1 task).
    return prisma.patient.update({ where: { id }, data: { active: false } });
  }

  async restore(id: string): Promise<Patient> {
    return prisma.patient.update({ where: { id }, data: { active: true } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.patient.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async count(): Promise<number> {
    return prisma.patient.count();
  }
}
