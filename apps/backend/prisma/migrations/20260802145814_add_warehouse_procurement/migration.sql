-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` CHAR(36) NOT NULL,
    `purchase_order_number` VARCHAR(30) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `order_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expected_date` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PARTIALLY_RECEIVED', 'RECEIVED') NOT NULL DEFAULT 'DRAFT',
    `total_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `submitted_at` DATETIME(3) NULL,
    `approved_by` CHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_by` CHAR(36) NULL,
    `rejected_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `cancelled_by` CHAR(36) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `cancel_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    UNIQUE INDEX `purchase_orders_purchase_order_number_key`(`purchase_order_number`),
    INDEX `purchase_orders_supplier_id_idx`(`supplier_id`),
    INDEX `purchase_orders_warehouse_id_idx`(`warehouse_id`),
    INDEX `purchase_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_items` (
    `id` CHAR(36) NOT NULL,
    `purchase_order_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `quantity_ordered` DECIMAL(18, 2) NOT NULL,
    `unit_price` DECIMAL(18, 2) NOT NULL,
    `subtotal` DECIMAL(18, 2) NOT NULL,
    `quantity_received` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `purchase_order_items_purchase_order_id_idx`(`purchase_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goods_receipts` (
    `id` CHAR(36) NOT NULL,
    `goods_receipt_number` VARCHAR(30) NOT NULL,
    `purchase_order_id` CHAR(36) NOT NULL,
    `warehouse_id` CHAR(36) NOT NULL,
    `receipt_date` DATETIME(3) NOT NULL,
    `supplier_document_no` VARCHAR(50) NULL,
    `status` ENUM('DRAFT', 'POSTED') NOT NULL DEFAULT 'DRAFT',
    `posted_by` CHAR(36) NULL,
    `posted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `goods_receipts_goods_receipt_number_key`(`goods_receipt_number`),
    INDEX `goods_receipts_purchase_order_id_idx`(`purchase_order_id`),
    INDEX `goods_receipts_warehouse_id_idx`(`warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goods_receipt_items` (
    `id` CHAR(36) NOT NULL,
    `goods_receipt_id` CHAR(36) NOT NULL,
    `purchase_order_item_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `quantity` DECIMAL(18, 2) NOT NULL,
    `unit_cost` DECIMAL(18, 2) NOT NULL,
    `batch_number` VARCHAR(50) NULL,
    `expiry_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `goods_receipt_items_goods_receipt_id_idx`(`goods_receipt_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipts` ADD CONSTRAINT `goods_receipts_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipts` ADD CONSTRAINT `goods_receipts_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipt_items` ADD CONSTRAINT `goods_receipt_items_goods_receipt_id_fkey` FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipt_items` ADD CONSTRAINT `goods_receipt_items_purchase_order_item_id_fkey` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_receipt_items` ADD CONSTRAINT `goods_receipt_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
