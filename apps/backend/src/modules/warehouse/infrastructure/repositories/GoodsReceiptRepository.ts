import { GoodsReceipt } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreateGoodsReceiptInput,
  GoodsReceiptWithItems,
  IGoodsReceiptRepository,
} from '../../domain/repositories/IGoodsReceiptRepository';

export class GoodsReceiptRepository implements IGoodsReceiptRepository {
  async create(input: CreateGoodsReceiptInput): Promise<GoodsReceiptWithItems> {
    return prisma.goodsReceipt.create({
      data: {
        goodsReceiptNumber: input.goodsReceiptNumber,
        purchaseOrderId: input.purchaseOrderId,
        warehouseId: input.warehouseId,
        receiptDate: input.receiptDate,
        supplierDocumentNo: input.supplierDocumentNo,
        createdBy: input.createdBy,
        items: {
          create: input.items.map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            itemId: item.itemId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findById(id: string): Promise<GoodsReceiptWithItems | null> {
    return prisma.goodsReceipt.findUnique({ where: { id }, include: { items: true } });
  }

  async findByNumber(goodsReceiptNumber: string): Promise<GoodsReceipt | null> {
    return prisma.goodsReceipt.findUnique({ where: { goodsReceiptNumber } });
  }

  async markPosted(id: string, postedBy: string, postedAt: Date): Promise<GoodsReceiptWithItems> {
    return prisma.goodsReceipt.update({
      where: { id },
      data: { status: 'POSTED', postedBy, postedAt, updatedBy: postedBy },
      include: { items: true },
    });
  }

  async count(): Promise<number> {
    return prisma.goodsReceipt.count();
  }
}
