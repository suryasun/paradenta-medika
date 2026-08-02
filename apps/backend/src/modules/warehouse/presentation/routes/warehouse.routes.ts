import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { CreateItemRequestDto, UpdateItemRequestDto } from '../../application/dtos/ItemRequestDto';
import { CreateSupplierRequestDto } from '../../application/dtos/SupplierRequestDto';
import { CreateWarehouseLocationRequestDto } from '../../application/dtos/WarehouseLocationRequestDto';
import { StockQueryDto } from '../../application/dtos/StockQueryDto';
import {
  CancelPurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  RejectPurchaseOrderRequestDto,
  UpdatePurchaseOrderRequestDto,
} from '../../application/dtos/PurchaseOrderRequestDto';
import { ListPurchaseOrderQueryDto } from '../../application/dtos/PurchaseOrderQueryDto';
import { CreateGoodsReceiptRequestDto } from '../../application/dtos/GoodsReceiptRequestDto';
import { CreateStockTransferRequestDto } from '../../application/dtos/StockTransferRequestDto';
import { CreateStockAdjustmentRequestDto } from '../../application/dtos/StockAdjustmentRequestDto';
import { CreateStockReservationRequestDto } from '../../application/dtos/StockReservationRequestDto';
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
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/CreatePurchaseOrderUseCase';
import { ListPurchaseOrdersUseCase } from '../../application/use-cases/ListPurchaseOrdersUseCase';
import { GetPurchaseOrderUseCase } from '../../application/use-cases/GetPurchaseOrderUseCase';
import { UpdatePurchaseOrderUseCase } from '../../application/use-cases/UpdatePurchaseOrderUseCase';
import { SubmitPurchaseOrderUseCase } from '../../application/use-cases/SubmitPurchaseOrderUseCase';
import { ApprovePurchaseOrderUseCase } from '../../application/use-cases/ApprovePurchaseOrderUseCase';
import { RejectPurchaseOrderUseCase } from '../../application/use-cases/RejectPurchaseOrderUseCase';
import { CancelPurchaseOrderUseCase } from '../../application/use-cases/CancelPurchaseOrderUseCase';
import { CreateGoodsReceiptUseCase } from '../../application/use-cases/CreateGoodsReceiptUseCase';
import { GetGoodsReceiptUseCase } from '../../application/use-cases/GetGoodsReceiptUseCase';
import { PostGoodsReceiptUseCase } from '../../application/use-cases/PostGoodsReceiptUseCase';
import { CreateStockTransferUseCase } from '../../application/use-cases/CreateStockTransferUseCase';
import { SubmitStockTransferUseCase } from '../../application/use-cases/SubmitStockTransferUseCase';
import { ApproveStockTransferUseCase } from '../../application/use-cases/ApproveStockTransferUseCase';
import { DispatchStockTransferUseCase } from '../../application/use-cases/DispatchStockTransferUseCase';
import { ReceiveStockTransferUseCase } from '../../application/use-cases/ReceiveStockTransferUseCase';
import { CreateStockAdjustmentUseCase } from '../../application/use-cases/CreateStockAdjustmentUseCase';
import { ApproveStockAdjustmentUseCase } from '../../application/use-cases/ApproveStockAdjustmentUseCase';
import { PostStockAdjustmentUseCase } from '../../application/use-cases/PostStockAdjustmentUseCase';
import { ReserveStockUseCase } from '../../application/use-cases/ReserveStockUseCase';
import { ReleaseStockReservationUseCase } from '../../application/use-cases/ReleaseStockReservationUseCase';
import { PurchaseOrderNumberGenerator } from '../../application/services/PurchaseOrderNumberGenerator';
import { GoodsReceiptNumberGenerator } from '../../application/services/GoodsReceiptNumberGenerator';
import { StockTransactionNumberGenerator } from '../../application/services/StockTransactionNumberGenerator';
import { StockTransferNumberGenerator } from '../../application/services/StockTransferNumberGenerator';
import { StockAdjustmentNumberGenerator } from '../../application/services/StockAdjustmentNumberGenerator';
import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';
import { SupplierRepository } from '../../infrastructure/repositories/SupplierRepository';
import { WarehouseLocationRepository } from '../../infrastructure/repositories/WarehouseLocationRepository';
import { StockRepository } from '../../infrastructure/repositories/StockRepository';
import { PurchaseOrderRepository } from '../../infrastructure/repositories/PurchaseOrderRepository';
import { GoodsReceiptRepository } from '../../infrastructure/repositories/GoodsReceiptRepository';
import { StockTransferRepository } from '../../infrastructure/repositories/StockTransferRepository';
import { StockAdjustmentRepository } from '../../infrastructure/repositories/StockAdjustmentRepository';
import { StockReservationRepository } from '../../infrastructure/repositories/StockReservationRepository';
import { ItemController } from '../controllers/ItemController';
import { SupplierController } from '../controllers/SupplierController';
import { WarehouseLocationController } from '../controllers/WarehouseLocationController';
import { StockController } from '../controllers/StockController';
import { PurchaseOrderController } from '../controllers/PurchaseOrderController';
import { GoodsReceiptController } from '../controllers/GoodsReceiptController';
import { StockTransferController } from '../controllers/StockTransferController';
import { StockAdjustmentController } from '../controllers/StockAdjustmentController';
import { StockReservationController } from '../controllers/StockReservationController';

/**
 * docs/06-tasks/task-095.md..task-114.md (Epic V Warehouse Foundation +
 * Epic W Procurement) composition root. Literal endpoint paths per
 * docs/03-sad/18-module-warehouse.md Section 6.1/6.2.
 */
export function buildWarehouseModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const itemRepository = new ItemRepository();
  const supplierRepository = new SupplierRepository();
  const warehouseLocationRepository = new WarehouseLocationRepository();
  const stockRepository = new StockRepository();
  const purchaseOrderRepository = new PurchaseOrderRepository();
  const goodsReceiptRepository = new GoodsReceiptRepository();
  const stockTransferRepository = new StockTransferRepository();
  const stockAdjustmentRepository = new StockAdjustmentRepository();
  const stockReservationRepository = new StockReservationRepository();

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

  const purchaseOrderController = new PurchaseOrderController(
    new CreatePurchaseOrderUseCase(purchaseOrderRepository, warehouseLocationRepository, new PurchaseOrderNumberGenerator(purchaseOrderRepository), auditService),
    new ListPurchaseOrdersUseCase(purchaseOrderRepository),
    new GetPurchaseOrderUseCase(purchaseOrderRepository),
    new UpdatePurchaseOrderUseCase(purchaseOrderRepository, auditService),
    new SubmitPurchaseOrderUseCase(purchaseOrderRepository, auditService),
    new ApprovePurchaseOrderUseCase(purchaseOrderRepository, auditService),
    new RejectPurchaseOrderUseCase(purchaseOrderRepository, auditService),
    new CancelPurchaseOrderUseCase(purchaseOrderRepository, auditService),
  );

  const goodsReceiptController = new GoodsReceiptController(
    new CreateGoodsReceiptUseCase(
      purchaseOrderRepository,
      goodsReceiptRepository,
      itemRepository,
      new GoodsReceiptNumberGenerator(goodsReceiptRepository),
      auditService,
    ),
    new GetGoodsReceiptUseCase(goodsReceiptRepository),
    new PostGoodsReceiptUseCase(
      goodsReceiptRepository,
      purchaseOrderRepository,
      stockRepository,
      new StockTransactionNumberGenerator(stockRepository),
      auditService,
      eventBus,
    ),
  );

  const stockTransferController = new StockTransferController(
    new CreateStockTransferUseCase(stockTransferRepository, new StockTransferNumberGenerator(stockTransferRepository), auditService),
    new SubmitStockTransferUseCase(stockTransferRepository, auditService),
    new ApproveStockTransferUseCase(stockTransferRepository, auditService),
    new DispatchStockTransferUseCase(stockTransferRepository, stockRepository, new StockTransactionNumberGenerator(stockRepository), auditService),
    new ReceiveStockTransferUseCase(stockTransferRepository, stockRepository, new StockTransactionNumberGenerator(stockRepository), auditService),
  );

  const stockAdjustmentController = new StockAdjustmentController(
    new CreateStockAdjustmentUseCase(stockAdjustmentRepository, new StockAdjustmentNumberGenerator(stockAdjustmentRepository), auditService),
    new ApproveStockAdjustmentUseCase(stockAdjustmentRepository, auditService),
    new PostStockAdjustmentUseCase(
      stockAdjustmentRepository,
      stockRepository,
      new StockTransactionNumberGenerator(stockRepository),
      auditService,
      eventBus,
    ),
  );

  const stockReservationController = new StockReservationController(
    new ReserveStockUseCase(stockReservationRepository, stockRepository, new StockTransactionNumberGenerator(stockRepository), auditService),
    new ReleaseStockReservationUseCase(stockReservationRepository, stockRepository, new StockTransactionNumberGenerator(stockRepository), auditService),
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

  // docs/06-tasks/task-104.md..task-110.md (Epic W, UC-WHS-001). Permission
  // codes are the literal `warehouse.purchase.*` catalog from
  // docs/03-sad/18-module-warehouse.md Section 8.1 -- task-105/106's own
  // text vaguely says "warehouse.item.manage (procurement scope)", but that
  // reuses Item's own permission for a different resource; the module's own
  // literal Section 8.1 catalog (read/create/submit/approve/receive/cancel)
  // is used instead as the actual source of truth.
  router.get(
    '/warehouse/purchase-orders',
    requirePermission('warehouse.purchase.read'),
    validateQuery(ListPurchaseOrderQueryDto),
    purchaseOrderController.list,
  );
  router.post(
    '/warehouse/purchase-orders',
    requirePermission('warehouse.purchase.create'),
    validateBody(CreatePurchaseOrderRequestDto),
    purchaseOrderController.create,
  );
  router.get('/warehouse/purchase-orders/:purchaseOrderId', requirePermission('warehouse.purchase.read'), purchaseOrderController.detail);
  // PATCH only edits a draft PO -- reuses `create` permission (the same
  // permission that lets someone draft a PO lets them edit their own draft
  // before submission); no separate "update" verb exists in Section 8.1.
  router.patch(
    '/warehouse/purchase-orders/:purchaseOrderId',
    requirePermission('warehouse.purchase.create'),
    validateBody(UpdatePurchaseOrderRequestDto),
    purchaseOrderController.update,
  );
  router.post(
    '/warehouse/purchase-orders/:purchaseOrderId/submit',
    requirePermission('warehouse.purchase.submit'),
    purchaseOrderController.submit,
  );
  router.post(
    '/warehouse/purchase-orders/:purchaseOrderId/approve',
    requirePermission('warehouse.purchase.approve'),
    purchaseOrderController.approve,
  );
  router.post(
    '/warehouse/purchase-orders/:purchaseOrderId/reject',
    requirePermission('warehouse.purchase.approve'),
    validateBody(RejectPurchaseOrderRequestDto),
    purchaseOrderController.reject,
  );
  router.post(
    '/warehouse/purchase-orders/:purchaseOrderId/cancel',
    requirePermission('warehouse.purchase.cancel'),
    validateBody(CancelPurchaseOrderRequestDto),
    purchaseOrderController.cancel,
  );

  // docs/06-tasks/task-111.md..task-114.md (Epic W, UC-WHS-002). Create
  // reuses `warehouse.purchase.receive` (literally "receive" in Section
  // 8.1); Post uses `warehouse.purchase.post`, an extrapolated addition to
  // that catalog since task-114 explicitly requires it be a *separate*
  // permission from Create for segregation of duties, and Section 8.1's
  // Purchase group has no distinct "post" verb to reuse instead.
  router.post(
    '/warehouse/goods-receipts',
    requirePermission('warehouse.purchase.receive'),
    validateBody(CreateGoodsReceiptRequestDto),
    goodsReceiptController.create,
  );
  router.get('/warehouse/goods-receipts/:goodsReceiptId', requirePermission('warehouse.purchase.read'), goodsReceiptController.detail);
  router.post(
    '/warehouse/goods-receipts/:goodsReceiptId/post',
    requirePermission('warehouse.purchase.post'),
    goodsReceiptController.post,
  );

  // docs/06-tasks/task-115.md..task-120.md (Epic X, UC-WHS-004). All
  // transfer workflow steps share `warehouse.stock.transfer` (the literal
  // Section 8.1 Stock group verb); maker-checker for Approve is enforced
  // at the use-case level (WarehouseSegregationOfDutiesException), the
  // same pattern as PO/Adjustment approval, since Section 8.1 has no
  // distinct per-step permission split for Transfer.
  router.post(
    '/warehouse/transfers',
    requirePermission('warehouse.stock.transfer'),
    validateBody(CreateStockTransferRequestDto),
    stockTransferController.create,
  );
  router.post('/warehouse/transfers/:transferId/submit', requirePermission('warehouse.stock.transfer'), stockTransferController.submit);
  router.post('/warehouse/transfers/:transferId/approve', requirePermission('warehouse.stock.transfer'), stockTransferController.approve);
  router.post('/warehouse/transfers/:transferId/dispatch', requirePermission('warehouse.stock.transfer'), stockTransferController.dispatch);
  router.post('/warehouse/transfers/:transferId/receive', requirePermission('warehouse.stock.transfer'), stockTransferController.receive);

  // docs/06-tasks/task-121.md..task-124.md (Epic X, UC-WHS-005). Create/
  // Approve share `warehouse.stock.adjust` (self-approval blocked at the
  // use-case level); Post uses `warehouse.stock.adjust.post`, an
  // extrapolated addition since task-124 explicitly requires it be
  // separate from Approve for segregation of duties and Section 8.1 has
  // no distinct "post" verb (same reasoning as `warehouse.purchase.post`
  // in Epic W).
  router.post(
    '/warehouse/adjustments',
    requirePermission('warehouse.stock.adjust'),
    validateBody(CreateStockAdjustmentRequestDto),
    stockAdjustmentController.create,
  );
  router.post('/warehouse/adjustments/:adjustmentId/approve', requirePermission('warehouse.stock.adjust'), stockAdjustmentController.approve);
  router.post(
    '/warehouse/adjustments/:adjustmentId/post',
    requirePermission('warehouse.stock.adjust.post'),
    stockAdjustmentController.post,
  );

  // docs/06-tasks/task-125.md/task-126.md (Epic X, UC-WHS-007). Both share
  // the literal `warehouse.stock.reserve` Section 8.1 verb.
  router.post(
    '/warehouse/reservations',
    requirePermission('warehouse.stock.reserve'),
    validateBody(CreateStockReservationRequestDto),
    stockReservationController.create,
  );
  router.post(
    '/warehouse/reservations/:reservationId/release',
    requirePermission('warehouse.stock.reserve'),
    stockReservationController.release,
  );

  return router;
}
