import { AuthorizationException, BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

export class ItemNotFoundException extends NotFoundException {
  constructor() {
    super('Item not found');
  }
}

export class ItemCodeExistsException extends ConflictException {
  constructor() {
    super('Item code already exists', 'ITEM_CODE_EXISTS');
  }
}

/** docs/06-tasks/task-097.md AC: cannot change batch/expiry tracking once the item has stock ledger entries. */
export class ItemTrackingFlagsLockedException extends BusinessException {
  constructor() {
    super('ITEM_TRACKING_FLAGS_LOCKED', 'isBatchTracked/isExpiryTracked cannot change once the item has stock ledger entries');
  }
}

export class SupplierNotFoundException extends NotFoundException {
  constructor() {
    super('Supplier not found');
  }
}

export class SupplierCodeExistsException extends ConflictException {
  constructor() {
    super('Supplier code already exists', 'SUPPLIER_CODE_EXISTS');
  }
}

export class WarehouseLocationNotFoundException extends NotFoundException {
  constructor() {
    super('Warehouse location not found');
  }
}

export class WarehouseLocationCodeExistsException extends ConflictException {
  constructor() {
    super('Warehouse location code already exists in this branch', 'WAREHOUSE_LOCATION_CODE_EXISTS');
  }
}

export class StockNotFoundException extends NotFoundException {
  constructor() {
    super('Stock balance not found');
  }
}

// ---------------------------------------------------------------------------
// Procurement (docs/03-sad/18-module-warehouse.md UC-WHS-001/UC-WHS-002,
// Section 6.5 literal error codes where they exist).
// ---------------------------------------------------------------------------

export class PurchaseOrderNotFoundException extends NotFoundException {
  constructor() {
    super('Purchase order not found');
  }
}

/** docs/06-tasks/task-106.md AC: PATCH rejected once submitted/approved -- must be draft. */
export class PurchaseOrderNotDraftException extends BusinessException {
  constructor() {
    super('WHS_PO_NOT_DRAFT', 'Purchase order can only be edited while in draft status');
  }
}

/** docs/06-tasks/task-107.md AC: only draft POs can be submitted. */
export class PurchaseOrderNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('WHS_PO_INVALID_STATUS', `Purchase order must be in ${expected} status for this action`);
  }
}

/**
 * docs/03-sad/18-module-warehouse.md Section 8.2 "Creator PO tidak dapat
 * meng-approve PO sendiri" -- no literal error code exists in Section 6.5's
 * 10-code table for this specific rule. Named by analogy to Finance's own
 * documented `FIN_SEGREGATION_OF_DUTIES` code (docs/03-sad/17-module-
 * finance.md Section 6.6) for the identical segregation-of-duties concept,
 * since Warehouse's own table doesn't enumerate one despite Section 8.2
 * requiring the rule.
 */
export class WarehouseSegregationOfDutiesException extends BusinessException {
  constructor() {
    super('WHS_SEGREGATION_OF_DUTIES', 'The requester of this document cannot also approve it');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_PO_NOT_APPROVED". */
export class PurchaseOrderNotApprovedException extends ConflictException {
  constructor() {
    super('Purchase order is not approved and cannot be received against', 'WHS_PO_NOT_APPROVED');
  }
}

/** docs/06-tasks/task-110.md AC: cancel rejected once any Goods Receipt has been posted. */
export class PurchaseOrderHasPostedReceiptsException extends BusinessException {
  constructor() {
    super('WHS_PO_HAS_POSTED_RECEIPTS', 'Purchase order cannot be cancelled once a Goods Receipt has been posted against it');
  }
}

export class GoodsReceiptNotFoundException extends NotFoundException {
  constructor() {
    super('Goods receipt not found');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_RECEIPT_OVER_QUANTITY". */
export class ReceiptOverQuantityException extends BusinessException {
  constructor() {
    super('WHS_RECEIPT_OVER_QUANTITY', 'Receipt quantity exceeds the ordered quantity remaining on the purchase order');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_BATCH_REQUIRED". */
export class BatchRequiredException extends BusinessException {
  constructor() {
    super('WHS_BATCH_REQUIRED', 'This item is batch-tracked and requires a batchNumber (and expiryDate if expiry-tracked)');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_DUPLICATE_MOVEMENT" -- reposting an already-posted receipt. */
export class GoodsReceiptAlreadyPostedException extends ConflictException {
  constructor() {
    super('This goods receipt has already been posted', 'WHS_DUPLICATE_MOVEMENT');
  }
}

// ---------------------------------------------------------------------------
// Stock Movement (docs/03-sad/18-module-warehouse.md UC-WHS-004/UC-WHS-005/
// UC-WHS-007, Section 6.5 literal error codes where they exist).
// ---------------------------------------------------------------------------

export class StockTransferNotFoundException extends NotFoundException {
  constructor() {
    super('Stock transfer not found');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_SOURCE_DESTINATION_SAME". */
export class SourceDestinationSameException extends BusinessException {
  constructor() {
    super('WHS_SOURCE_DESTINATION_SAME', 'Transfer source and destination warehouse must be different');
  }
}

export class StockTransferNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('WHS_TRANSFER_INVALID_STATUS', `Stock transfer must be in ${expected} status for this action`);
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_STOCK_INSUFFICIENT". */
export class StockInsufficientException extends ConflictException {
  constructor() {
    super('Available stock is insufficient for this operation', 'WHS_STOCK_INSUFFICIENT');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_DUPLICATE_MOVEMENT" -- reposting an already-received transfer. */
export class StockTransferAlreadyReceivedException extends ConflictException {
  constructor() {
    super('This transfer has already been received', 'WHS_DUPLICATE_MOVEMENT');
  }
}

export class StockAdjustmentNotFoundException extends NotFoundException {
  constructor() {
    super('Stock adjustment not found');
  }
}

export class StockAdjustmentNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('WHS_ADJUSTMENT_INVALID_STATUS', `Stock adjustment must be in ${expected} status for this action`);
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_ADJUSTMENT_APPROVAL_REQUIRED" (403). */
export class AdjustmentApprovalRequiredException extends AuthorizationException {
  constructor() {
    super('This adjustment must be approved before it can be posted', 'WHS_ADJUSTMENT_APPROVAL_REQUIRED');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_NEGATIVE_STOCK_FORBIDDEN". */
export class NegativeStockForbiddenException extends BusinessException {
  constructor() {
    super('WHS_NEGATIVE_STOCK_FORBIDDEN', 'This mutation would result in a negative stock balance');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_DUPLICATE_MOVEMENT" -- reposting an already-posted adjustment. */
export class StockAdjustmentAlreadyPostedException extends ConflictException {
  constructor() {
    super('This adjustment has already been posted', 'WHS_DUPLICATE_MOVEMENT');
  }
}

export class StockReservationNotFoundException extends NotFoundException {
  constructor() {
    super('Stock reservation not found');
  }
}

// ---------------------------------------------------------------------------
// Stock Opname & Batch (docs/03-sad/18-module-warehouse.md UC-WHS-006,
// Section 6.5 literal error codes where they exist).
// ---------------------------------------------------------------------------

export class StockOpnameNotFoundException extends NotFoundException {
  constructor() {
    super('Stock opname not found');
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_OPNAME_ALREADY_ACTIVE" (409). */
export class StockOpnameAlreadyActiveException extends ConflictException {
  constructor() {
    super('This warehouse already has an active stock opname for this date', 'WHS_OPNAME_ALREADY_ACTIVE');
  }
}

/**
 * No literal Section 6.5 code covers a wrong-status opname action (Update/
 * Start-Count/Submit/Approve out of sequence) -- extrapolated by the same
 * `WHS_TRANSFER_INVALID_STATUS`/`WHS_ADJUSTMENT_INVALID_STATUS` naming
 * convention already established in Epic X for the identical gap.
 */
export class StockOpnameNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('WHS_OPNAME_INVALID_STATUS', `Stock opname must be in ${expected} status for this action`);
  }
}

/** docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_DUPLICATE_MOVEMENT" -- reposting an already-posted opname (task-133 AC). */
export class StockOpnameAlreadyPostedException extends ConflictException {
  constructor() {
    super('This stock opname has already been posted', 'WHS_DUPLICATE_MOVEMENT');
  }
}

/** Submit rejects any line whose itemId was not part of the opname's original scope (set at Create/Update time). */
export class StockOpnameItemNotInScopeException extends BusinessException {
  constructor() {
    super('WHS_OPNAME_ITEM_NOT_IN_SCOPE', 'One or more submitted items are not part of this opname\'s scope');
  }
}

export class BatchNotFoundException extends NotFoundException {
  constructor() {
    super('Batch not found');
  }
}

/** No literal Section 6.5 code for quarantining a non-active batch -- extrapolated by the same `WHS_*_INVALID_STATUS` convention. */
export class BatchNotActiveException extends BusinessException {
  constructor() {
    super('WHS_BATCH_INVALID_STATUS', 'Only an active batch can be quarantined');
  }
}

// ---------------------------------------------------------------------------
// Automatic Stock Update (docs/03-sad/18-module-warehouse.md UC-WHS-003,
// Section 6.5 literal error codes where they exist; Epic Z task-136).
// ---------------------------------------------------------------------------

/**
 * docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_BATCH_EXPIRED" (422,
 * per task-136's own AC). Raised only when FEFO allocation cannot be
 * satisfied from non-expired active batches but expired stock exists --
 * distinct from genuine `WHS_STOCK_INSUFFICIENT` where no stock exists at
 * all, expired or not.
 */
export class BatchExpiredException extends BusinessException {
  constructor() {
    super('WHS_BATCH_EXPIRED', 'Remaining batch stock for this item has expired and cannot be consumed');
  }
}

/**
 * No literal Section 6.5 code for selecting a non-consumable item as
 * treatment material -- `is_consumable` (Section 5.2) exists precisely to
 * flag items that must never be selected here (e.g. capital equipment).
 * Extrapolated by the same `WHS_ITEM_*` naming convention as
 * `ITEM_CODE_EXISTS`/`ITEM_TRACKING_FLAGS_LOCKED`.
 */
export class ItemNotConsumableException extends BusinessException {
  constructor() {
    super('WHS_ITEM_NOT_CONSUMABLE', 'This item is not flagged as consumable and cannot be recorded as treatment material');
  }
}

/**
 * docs/03-sad/18-module-warehouse.md Section 6.5: "WHS_DUPLICATE_MOVEMENT"
 * (409) -- redelivery of an already-processed
 * `emr.treatment-material-finalized.v1` event for the same VisitTreatment
 * must not double-consume stock (task-136 AC: idempotent redelivery).
 */
export class MaterialConsumptionAlreadyProcessedException extends ConflictException {
  constructor() {
    super('Materials for this treatment have already been consumed', 'WHS_DUPLICATE_MOVEMENT');
  }
}
