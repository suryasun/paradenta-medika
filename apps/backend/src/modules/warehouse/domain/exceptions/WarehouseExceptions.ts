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
