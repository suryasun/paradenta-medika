import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { CreateItemRequestDto, UpdateItemRequestDto } from '../../application/dtos/ItemRequestDto';
import { CreateSupplierRequestDto } from '../../application/dtos/SupplierRequestDto';
import { CreateWarehouseLocationRequestDto } from '../../application/dtos/WarehouseLocationRequestDto';
import { StockQueryDto } from '../../application/dtos/StockQueryDto';
import { CreateItemUseCase } from '../../application/use-cases/CreateItemUseCase';
import { ListItemsUseCase } from '../../application/use-cases/ListItemsUseCase';
import { GetItemUseCase } from '../../application/use-cases/GetItemUseCase';
import { UpdateItemUseCase } from '../../application/use-cases/UpdateItemUseCase';
import { CreateSupplierUseCase } from '../../application/use-cases/CreateSupplierUseCase';
import { ListSuppliersUseCase } from '../../application/use-cases/ListSuppliersUseCase';
import { CreateWarehouseLocationUseCase } from '../../application/use-cases/CreateWarehouseLocationUseCase';
import { ListWarehouseLocationsUseCase } from '../../application/use-cases/ListWarehouseLocationsUseCase';
import { ListStocksUseCase } from '../../application/use-cases/ListStocksUseCase';
import { GetStockLedgerUseCase } from '../../application/use-cases/GetStockLedgerUseCase';
import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';
import { SupplierRepository } from '../../infrastructure/repositories/SupplierRepository';
import { WarehouseLocationRepository } from '../../infrastructure/repositories/WarehouseLocationRepository';
import { StockRepository } from '../../infrastructure/repositories/StockRepository';
import { ItemController } from '../controllers/ItemController';
import { SupplierController } from '../controllers/SupplierController';
import { WarehouseLocationController } from '../controllers/WarehouseLocationController';
import { StockController } from '../controllers/StockController';

/**
 * docs/06-tasks/task-095.md..task-103.md (Epic V: Warehouse Foundation)
 * composition root. Literal endpoint paths per
 * docs/03-sad/18-module-warehouse.md Section 6.1.
 */
export function buildWarehouseModule(
  auditService: IAuditService,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const itemRepository = new ItemRepository();
  const supplierRepository = new SupplierRepository();
  const warehouseLocationRepository = new WarehouseLocationRepository();
  const stockRepository = new StockRepository();

  const itemController = new ItemController(
    new CreateItemUseCase(itemRepository, auditService),
    new ListItemsUseCase(itemRepository),
    new GetItemUseCase(itemRepository),
    new UpdateItemUseCase(itemRepository, auditService),
  );

  const supplierController = new SupplierController(
    new CreateSupplierUseCase(supplierRepository, auditService),
    new ListSuppliersUseCase(supplierRepository),
  );

  const warehouseLocationController = new WarehouseLocationController(
    new CreateWarehouseLocationUseCase(warehouseLocationRepository, auditService),
    new ListWarehouseLocationsUseCase(warehouseLocationRepository),
  );

  const stockController = new StockController(
    new ListStocksUseCase(stockRepository, itemRepository),
    new GetStockLedgerUseCase(stockRepository),
  );

  const router = Router();
  router.use(authenticate);

  router.get('/warehouse/items', requirePermission('warehouse.item.read'), validateQuery(ListQueryDto), itemController.list);
  router.post(
    '/warehouse/items',
    requirePermission('warehouse.item.manage'),
    validateBody(CreateItemRequestDto),
    itemController.create,
  );
  router.get('/warehouse/items/:itemId', requirePermission('warehouse.item.read'), itemController.detail);
  router.patch(
    '/warehouse/items/:itemId',
    requirePermission('warehouse.item.manage'),
    validateBody(UpdateItemRequestDto),
    itemController.update,
  );

  router.get(
    '/warehouse/suppliers',
    requirePermission('warehouse.supplier.read'),
    validateQuery(ListQueryDto),
    supplierController.list,
  );
  router.post(
    '/warehouse/suppliers',
    requirePermission('warehouse.supplier.manage'),
    validateBody(CreateSupplierRequestDto),
    supplierController.create,
  );

  router.get(
    '/warehouse/warehouses',
    requirePermission('warehouse.location.read'),
    validateQuery(ListQueryDto),
    warehouseLocationController.list,
  );
  router.post(
    '/warehouse/warehouses',
    requirePermission('warehouse.location.manage'),
    validateBody(CreateWarehouseLocationRequestDto),
    warehouseLocationController.create,
  );

  router.get('/warehouse/stocks', requirePermission('warehouse.stock.read'), validateQuery(StockQueryDto), stockController.list);
  router.get('/warehouse/stocks/:stockId/ledger', requirePermission('warehouse.stock.read'), stockController.ledger);

  return router;
}
