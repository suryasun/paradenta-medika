import { PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreatePaymentMethodInput,
  IPaymentMethodRepository,
  UpdatePaymentMethodInput,
} from '../../domain/repositories/IPaymentMethodRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'methodCode', 'methodName'] as const;

export class PaymentMethodRepository implements IPaymentMethodRepository {
  async create(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.create({ data: input });
  }

  async list(query: ListQueryDto): Promise<PagedResult<PaymentMethod>> {
    const where: Prisma.PaymentMethodWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ methodCode: { contains: query.search } }, { methodName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.paymentMethod.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.paymentMethod.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(methodCode: string): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findFirst({ where: { methodCode, deletedAt: null } });
  }

  async update(id: string, input: UpdatePaymentMethodInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.update({ where: { id }, data: input });
  }
}
