import { Prisma, StockTransaction } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  IWarehouseReportRepository,
  MovementsFilter,
  PurchasesReportFilter,
  PurchasesReportRow,
  StockCardFilter,
} from '../../domain/repositories/IWarehouseReportRepository';

const LEDGER_SORT_FIELDS = ['transactionDate', 'createdAt'] as const;
const PURCHASE_SORT_FIELDS = ['orderDate', 'purchaseOrderNumber'] as const;

export class WarehouseReportRepository implements IWarehouseReportRepository {
  async getStockCard(filter: StockCardFilter, query: ListQueryDto): Promise<PagedResult<StockTransaction>> {
    const where: Prisma.StockTransactionWhereInput = {
      warehouseId: filter.warehouseId,
      itemId: filter.itemId,
      transactionDate: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, LEDGER_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.stockTransaction.count({ where }),
    ]);
    return { items, total };
  }

  async getMovements(filter: MovementsFilter, query: ListQueryDto): Promise<PagedResult<StockTransaction>> {
    const where: Prisma.StockTransactionWhereInput = {
      warehouseId: filter.warehouseId,
      itemId: filter.itemId,
      transactionType: filter.transactionType,
      referenceType: filter.referenceType,
      performedBy: filter.performedBy,
      transactionDate: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, LEDGER_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.stockTransaction.count({ where }),
    ]);
    return { items, total };
  }

  async getPurchasesReport(filter: PurchasesReportFilter, query: ListQueryDto): Promise<PagedResult<PurchasesReportRow>> {
    const where: Prisma.PurchaseOrderWhereInput = {
      deletedAt: null,
      warehouseId: filter.warehouseId,
      supplierId: filter.supplierId,
      status: filter.status,
      orderDate: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
    };
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { items: true, goodsReceipts: true },
        orderBy: { [sanitizeSortField(query.sort, PURCHASE_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    const items: PurchasesReportRow[] = orders.map((po) => {
      const postedReceipts = po.goodsReceipts.filter((r) => r.status === 'POSTED' && r.postedAt);
      const firstReceiptPostedAt = postedReceipts.length
        ? postedReceipts.reduce((earliest, r) => (r.postedAt! < earliest ? r.postedAt! : earliest), postedReceipts[0].postedAt!)
        : null;

      return {
        purchaseOrderId: po.id,
        purchaseOrderNumber: po.purchaseOrderNumber,
        supplierId: po.supplierId,
        warehouseId: po.warehouseId,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
        status: po.status,
        totalAmount: Number(po.totalAmount),
        orderedQuantity: po.items.reduce((sum, item) => sum + Number(item.quantityOrdered), 0),
        receivedQuantity: po.items.reduce((sum, item) => sum + Number(item.quantityReceived), 0),
        receiptCount: po.goodsReceipts.length,
        firstReceiptPostedAt,
      };
    });

    return { items, total };
  }
}
