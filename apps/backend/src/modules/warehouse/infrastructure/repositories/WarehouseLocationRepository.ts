import { Prisma, WarehouseLocation } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateWarehouseLocationInput, IWarehouseLocationRepository } from '../../domain/repositories/IWarehouseLocationRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'locationCode', 'locationName'] as const;

export class WarehouseLocationRepository implements IWarehouseLocationRepository {
  async create(input: CreateWarehouseLocationInput): Promise<WarehouseLocation> {
    return prisma.warehouseLocation.create({
      data: {
        branchId: input.branchId,
        locationCode: input.locationCode,
        locationName: input.locationName,
        locationType: input.locationType ?? 'MAIN',
        address: input.address,
        managerUserId: input.managerUserId,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto): Promise<PagedResult<WarehouseLocation>> {
    const where: Prisma.WarehouseLocationWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ locationCode: { contains: query.search } }, { locationName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.warehouseLocation.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.warehouseLocation.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<WarehouseLocation | null> {
    return prisma.warehouseLocation.findFirst({ where: { id, deletedAt: null } });
  }

  async findByBranchAndCode(branchId: string, locationCode: string): Promise<WarehouseLocation | null> {
    return prisma.warehouseLocation.findFirst({ where: { branchId, locationCode, deletedAt: null } });
  }
}
