import { Prisma, User } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateUserAdminInput, IUserAdminRepository, PagedResult, UserAdminListFilter } from '../../domain/repositories/IUserAdminRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'username', 'email', 'status'] as const;

export class UserAdminRepository implements IUserAdminRepository {
  async create(input: CreateUserAdminInput): Promise<User> {
    return prisma.user.create({
      data: { username: input.username, email: input.email, passwordHash: input.passwordHash },
    });
  }

  async list(query: ListQueryDto, filter?: UserAdminListFilter): Promise<PagedResult<User>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ username: { contains: query.search } }, { email: { contains: query.search } }] }
        : {}),
      ...(filter?.branchIds ? { userBranches: { some: { branchId: { in: filter.branchIds } } } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async existsByUsernameOrEmail(username: string, email: string, excludeUserId?: string): Promise<boolean> {
    const found = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }], ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    });
    return found !== null;
  }

  async updateEmail(id: string, email: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { email } });
  }

  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<User> {
    return prisma.user.update({ where: { id }, data: { status } });
  }
}
