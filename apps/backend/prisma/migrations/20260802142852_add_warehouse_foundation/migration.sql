-- CreateTable
CREATE TABLE `item_categories` (
    `id` CHAR(36) NOT NULL,
    `category_code` VARCHAR(30) NOT NULL,
    `category_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    UNIQUE INDEX `item_categories_category_code_key`(`category_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` CHAR(36) NOT NULL,
    `unit_code` VARCHAR(20) NOT NULL,
    `unit_name` VARCHAR(50) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    UNIQUE INDEX `units_unit_code_key`(`unit_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` CHAR(36) NOT NULL,
    `item_code` VARCHAR(30) NOT NULL,
    `item_name` VARCHAR(150) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `unit_id` CHAR(36) NOT NULL,
    `minimum_stock` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `purchase_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `is_consumable` BOOLEAN NOT NULL DEFAULT true,
    `is_batch_tracked` BOOLEAN NOT NULL DEFAULT false,
    `is_expiry_tracked` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    UNIQUE INDEX `items_item_code_key`(`item_code`),
    INDEX `items_category_id_idx`(`category_id`),
    INDEX `items_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` CHAR(36) NOT NULL,
    `supplier_code` VARCHAR(30) NOT NULL,
    `supplier_name` VARCHAR(150) NOT NULL,
    `pic_name` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `tax_number` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    UNIQUE INDEX `suppliers_supplier_code_key`(`supplier_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `location_code` VARCHAR(30) NOT NULL,
    `location_name` VARCHAR(150) NOT NULL,
    `location_type` VARCHAR(30) NOT NULL DEFAULT 'MAIN',
    `address` TEXT NULL,
    `manager_user_id` CHAR(36) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    INDEX `warehouses_branch_id_idx`(`branch_id`),
    UNIQUE INDEX `warehouses_branch_id_location_code_key`(`branch_id`, `location_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouse_stocks` (
    `id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `current_stock` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `reserved_stock` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `available_stock` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `minimum_stock` DECIMAL(18, 2) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `last_transaction_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `warehouse_stocks_item_id_idx`(`item_id`),
    UNIQUE INDEX `warehouse_stocks_warehouse_id_item_id_key`(`warehouse_id`, `item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_transactions` (
    `id` CHAR(36) NOT NULL,
    `transaction_number` VARCHAR(30) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `batch_id` CHAR(36) NULL,
    `transaction_type` ENUM('PURCHASE', 'SALE', 'TREATMENT', 'ADJUSTMENT', 'TRANSFER', 'OPNAME', 'RETURN', 'RESERVATION', 'RELEASE_RESERVATION') NOT NULL,
    `reference_type` VARCHAR(50) NOT NULL,
    `reference_id` CHAR(36) NOT NULL,
    `qty_in` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `qty_out` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `balance` DECIMAL(18, 2) NOT NULL,
    `transaction_date` DATETIME(3) NOT NULL,
    `performed_by` CHAR(36) NOT NULL,
    `approved_by` CHAR(36) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stock_transactions_transaction_number_key`(`transaction_number`),
    INDEX `stock_transactions_warehouse_id_item_id_transaction_date_idx`(`warehouse_id`, `item_id`, `transaction_date`),
    INDEX `stock_transactions_reference_type_reference_id_idx`(`reference_type`, `reference_id`),
    UNIQUE INDEX `stock_transactions_reference_type_reference_id_transaction_t_key`(`reference_type`, `reference_id`, `transaction_type`, `item_id`, `batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `item_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse_stocks` ADD CONSTRAINT `warehouse_stocks_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse_stocks` ADD CONSTRAINT `warehouse_stocks_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transactions` ADD CONSTRAINT `stock_transactions_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transactions` ADD CONSTRAINT `stock_transactions_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
