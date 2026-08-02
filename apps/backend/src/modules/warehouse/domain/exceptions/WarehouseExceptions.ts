import { BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

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
