import { Prisma, StockTransaction, WarehouseStock } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { ApplyStockMovementInput, IStockRepository, StockListFilter } from '../../domain/repositories/IStockRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'currentStock', 'availableStock'] as const;

export class StockRepository implements IStockRepository {
  async list(query: ListQueryDto, filter: StockListFilter): Promise<PagedResult<WarehouseStock>> {
    const where: Prisma.WarehouseStockWhereInput = {
      itemId: filter.itemId,
      warehouseId: filter.warehouseId,
    };
    const [items, total] = await Promise.all([
      prisma.warehouseStock.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.warehouseStock.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<WarehouseStock | null> {
    return prisma.warehouseStock.findUnique({ where: { id } });
  }

  async findLedgerByWarehouseAndItem(warehouseId: string, itemId: string): Promise<StockTransaction[]> {
    return prisma.stockTransaction.findMany({
      where: { warehouseId, itemId },
      orderBy: { transactionDate: 'asc' },
    });
  }

  async findByTransactionNumber(transactionNumber: string): Promise<StockTransaction | null> {
    return prisma.stockTransaction.findUnique({ where: { transactionNumber } });
  }

  async countTransactions(): Promise<number> {
    return prisma.stockTransaction.count();
  }

  /**
   * docs/03-sad/18-module-warehouse.md Section 3.5 Rules 1-2: locks the
   * balance row (optimistic `version` check, one of the two SAD-allowed
   * strategies) inside a transaction, computes the new balance, and writes
   * exactly one ledger row atomically with the balance update. A lost
   * optimistic-lock race throws so the caller can retry -- no generalized
   * retry loop is built here (out of Epic W's literal scope; concurrent
   * stock-out contention is Epic X's TC-WHS-015 concern).
   */
  async applyStockMovement(input: ApplyStockMovementInput): Promise<StockTransaction> {
    return prisma.$transaction(async (tx) => {
      let stock = await tx.warehouseStock.findUnique({
        where: { warehouseId_itemId: { warehouseId: input.warehouseId, itemId: input.itemId } },
      });

      if (!stock) {
        try {
          stock = await tx.warehouseStock.create({
            data: { warehouseId: input.warehouseId, itemId: input.itemId, currentStock: 0, reservedStock: 0, availableStock: 0, version: 0 },
          });
        } catch {
          // Concurrent first-ever posting for this warehouse/item pair created it first.
          stock = await tx.warehouseStock.findUniqueOrThrow({
            where: { warehouseId_itemId: { warehouseId: input.warehouseId, itemId: input.itemId } },
          });
        }
      }

      const qtyIn = input.qtyIn ?? 0;
      const qtyOut = input.qtyOut ?? 0;
      const newCurrentStock = Number(stock.currentStock) + qtyIn - qtyOut;
      const newAvailableStock = newCurrentStock - Number(stock.reservedStock);

      const updateResult = await tx.warehouseStock.updateMany({
        where: { id: stock.id, version: stock.version },
        data: {
          currentStock: newCurrentStock,
          availableStock: newAvailableStock,
          version: { increment: 1 },
          lastTransactionAt: input.transactionDate,
        },
      });
      if (updateResult.count === 0) {
        throw new Error('Stock balance was concurrently modified; retry the operation');
      }

      return tx.stockTransaction.create({
        data: {
          transactionNumber: input.transactionNumber,
          warehouseId: input.warehouseId,
          itemId: input.itemId,
          batchId: input.batchId ?? null,
          transactionType: input.transactionType,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          qtyIn,
          qtyOut,
          balance: newCurrentStock,
          transactionDate: input.transactionDate,
          performedBy: input.performedBy,
          approvedBy: input.approvedBy,
          notes: input.notes,
        },
      });
    });
  }
}
