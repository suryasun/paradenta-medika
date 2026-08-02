import { Prisma, Supplier } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateSupplierInput, ISupplierRepository } from '../../domain/repositories/ISupplierRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'supplierCode', 'supplierName'] as const;

export class SupplierRepository implements ISupplierRepository {
  async create(input: CreateSupplierInput): Promise<Supplier> {
    return prisma.supplier.create({
      data: {
        supplierCode: input.supplierCode,
        supplierName: input.supplierName,
        picName: input.picName,
        phone: input.phone,
        address: input.address,
        taxNumber: input.taxNumber,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto): Promise<PagedResult<Supplier>> {
    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ supplierCode: { contains: query.search } }, { supplierName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.supplier.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Supplier | null> {
    return prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(supplierCode: string): Promise<Supplier | null> {
    return prisma.supplier.findFirst({ where: { supplierCode, deletedAt: null } });
  }
}
