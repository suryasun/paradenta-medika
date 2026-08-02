import { Doctor, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateDoctorInput, IDoctorRepository, UpdateDoctorInput } from '../../domain/repositories/IDoctorRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'doctorCode', 'fullName'] as const;

function toCreateData(input: CreateDoctorInput): Prisma.DoctorCreateInput {
  return {
    doctorCode: input.doctorCode,
    user: { connect: { id: input.userId } },
    branch: { connect: { id: input.branchId } },
    fullName: input.fullName,
    sipNumber: input.sipNumber,
    strNumber: input.strNumber,
    specialization: input.specialization,
    consultationFee: input.consultationFee,
    joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
    phone: input.phone,
    email: input.email,
  };
}

function toUpdateData(input: UpdateDoctorInput): Prisma.DoctorUpdateInput {
  return {
    doctorCode: input.doctorCode,
    branch: input.branchId ? { connect: { id: input.branchId } } : undefined,
    fullName: input.fullName,
    sipNumber: input.sipNumber,
    strNumber: input.strNumber,
    specialization: input.specialization,
    consultationFee: input.consultationFee,
    joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
    phone: input.phone,
    email: input.email,
    isActive: input.isActive,
  };
}

export class DoctorRepository implements IDoctorRepository {
  async create(input: CreateDoctorInput): Promise<Doctor> {
    return prisma.doctor.create({ data: toCreateData(input) });
  }

  async list(query: ListQueryDto): Promise<PagedResult<Doctor>> {
    const where: Prisma.DoctorWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ doctorCode: { contains: query.search } }, { fullName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.doctor.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Doctor | null> {
    return prisma.doctor.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(doctorCode: string): Promise<Doctor | null> {
    return prisma.doctor.findFirst({ where: { doctorCode, deletedAt: null } });
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    return prisma.doctor.findFirst({ where: { userId, deletedAt: null } });
  }

  async update(id: string, input: UpdateDoctorInput): Promise<Doctor> {
    return prisma.doctor.update({ where: { id }, data: toUpdateData(input) });
  }
}
