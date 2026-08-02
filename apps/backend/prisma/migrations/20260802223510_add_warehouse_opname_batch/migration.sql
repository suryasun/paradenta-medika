-- CreateTable
CREATE TABLE `stock_opnames` (
    `id` CHAR(36) NOT NULL,
    `opname_number` VARCHAR(30) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `opname_date` DATE NOT NULL,
    `status` ENUM('DRAFT', 'COUNTING', 'SUBMITTED', 'APPROVED', 'POSTED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `snapshot_at` DATETIME(3) NULL,
    `submitted_at` DATETIME(3) NULL,
    `approved_by` CHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `posted_by` CHAR(36) NULL,
    `posted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `stock_opnames_opname_number_key`(`opname_number`),
    INDEX `stock_opnames_warehouse_id_opname_date_idx`(`warehouse_id`, `opname_date`),
    INDEX `stock_opnames_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_opname_items` (
    `id` CHAR(36) NOT NULL,
    `opname_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `system_quantity` DECIMAL(18, 2) NULL,
    `physical_quantity` DECIMAL(18, 2) NULL,
    `variance` DECIMAL(18, 2) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_opname_items_opname_id_idx`(`opname_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_batches` (
    `id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `batch_number` VARCHAR(50) NOT NULL,
    `received_date` DATE NOT NULL,
    `expiry_date` DATE NULL,
    `initial_quantity` DECIMAL(18, 2) NOT NULL,
    `remaining_quantity` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('ACTIVE', 'QUARANTINED', 'EXPIRED', 'DEPLETED') NOT NULL DEFAULT 'ACTIVE',
    `quarantined_by` CHAR(36) NULL,
    `quarantined_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `item_batches_item_id_idx`(`item_id`),
    INDEX `item_batches_expiry_date_idx`(`expiry_date`),
    INDEX `item_batches_status_idx`(`status`),
    UNIQUE INDEX `item_batches_warehouse_id_item_id_batch_number_key`(`warehouse_id`, `item_id`, `batch_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_transactions` ADD CONSTRAINT `stock_transactions_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `item_batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opnames` ADD CONSTRAINT `stock_opnames_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opname_items` ADD CONSTRAINT `stock_opname_items_opname_id_fkey` FOREIGN KEY (`opname_id`) REFERENCES `stock_opnames`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_opname_items` ADD CONSTRAINT `stock_opname_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_batches` ADD CONSTRAINT `item_batches_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_batches` ADD CONSTRAINT `item_batches_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
