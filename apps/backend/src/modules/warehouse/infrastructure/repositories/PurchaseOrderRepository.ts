import { Prisma, PurchaseOrder, PurchaseOrderStatus } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreatePurchaseOrderInput,
  IPurchaseOrderRepository,
  PurchaseOrderListFilter,
  PurchaseOrderWithItems,
  ReplacePurchaseOrderItemsInput,
} from '../../domain/repositories/IPurchaseOrderRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'orderDate', 'purchaseOrderNumber'] as const;

function computeSubtotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export class PurchaseOrderRepository implements IPurchaseOrderRepository {
  async create(input: CreatePurchaseOrderInput): Promise<PurchaseOrderWithItems> {
    const totalAmount = input.items.reduce((sum, item) => sum + computeSubtotal(item.quantity, item.unitPrice), 0);

    return prisma.purchaseOrder.create({
      data: {
        purchaseOrderNumber: input.purchaseOrderNumber,
        supplierId: input.supplierId,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        expectedDate: input.expectedDate,
        totalAmount,
        createdBy: input.createdBy,
        items: {
          create: input.items.map((item) => ({
            itemId: item.itemId,
            quantityOrdered: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: computeSubtotal(item.quantity, item.unitPrice),
          })),
        },
      },
      include: { items: true },
    });
  }

  async list(query: ListQueryDto, filter: PurchaseOrderListFilter): Promise<PagedResult<PurchaseOrderWithItems>> {
    const where: Prisma.PurchaseOrderWhereInput = {
      deletedAt: null,
      status: filter.status,
      supplierId: filter.supplierId,
      warehouseId: filter.warehouseId,
      ...(query.search ? { purchaseOrderNumber: { contains: query.search } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { items: true },
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<PurchaseOrderWithItems | null> {
    return prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null }, include: { items: true } });
  }

  async findByNumber(purchaseOrderNumber: string): Promise<PurchaseOrder | null> {
    return prisma.purchaseOrder.findUnique({ where: { purchaseOrderNumber } });
  }

  async replaceItems(id: string, input: ReplacePurchaseOrderItemsInput): Promise<PurchaseOrderWithItems> {
    return prisma.$transaction(async (tx) => {
      if (input.items) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
        await tx.purchaseOrderItem.createMany({
          data: input.items.map((item) => ({
            purchaseOrderId: id,
            itemId: item.itemId,
            quantityOrdered: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: computeSubtotal(item.quantity, item.unitPrice),
          })),
        });
      }

      const totalAmount = input.items
        ? input.items.reduce((sum, item) => sum + computeSubtotal(item.quantity, item.unitPrice), 0)
        : undefined;

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          warehouseId: input.warehouseId,
          expectedDate: input.expectedDate,
          totalAmount,
          updatedBy: input.updatedBy,
        },
        include: { items: true },
      });
    });
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    fields: {
      submittedAt?: Date;
      approvedBy?: string;
      approvedAt?: Date;
      rejectedBy?: string;
      rejectedAt?: Date;
      rejectionReason?: string;
      cancelledBy?: string;
      cancelledAt?: Date;
      cancelReason?: string;
    },
  ): Promise<PurchaseOrderWithItems> {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status, ...fields },
      include: { items: true },
    });
  }

  async incrementReceivedQuantity(purchaseOrderItemId: string, quantity: number): Promise<void> {
    await prisma.purchaseOrderItem.update({
      where: { id: purchaseOrderItemId },
      data: { quantityReceived: { increment: quantity } },
    });
  }

  async hasPostedGoodsReceipts(purchaseOrderId: string): Promise<boolean> {
    const count = await prisma.goodsReceipt.count({ where: { purchaseOrderId, status: 'POSTED' } });
    return count > 0;
  }

  async count(): Promise<number> {
    return prisma.purchaseOrder.count();
  }

  async countOpenByBranch(branchId: string): Promise<number> {
    return prisma.purchaseOrder.count({
      where: { branchId, status: { notIn: ['RECEIVED', 'CANCELLED', 'REJECTED'] } },
    });
  }
}
