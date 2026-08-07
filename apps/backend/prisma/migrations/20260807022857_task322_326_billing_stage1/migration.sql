-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `reason` TEXT NULL,
    MODIFY `reference_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `cancel_reason` TEXT NULL,
    ADD COLUMN `cancelled_at` DATETIME(3) NULL,
    ADD COLUMN `cancelled_by` CHAR(36) NULL,
    ADD COLUMN `discount_approved_by` CHAR(36) NULL,
    ADD COLUMN `discount_reason` TEXT NULL,
    ADD COLUMN `discount_source` VARCHAR(20) NULL,
    ADD COLUMN `void_reason` TEXT NULL,
    ADD COLUMN `voided_at` DATETIME(3) NULL,
    ADD COLUMN `voided_by` CHAR(36) NULL,
    MODIFY `status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'CANCELLED', 'VOID') NOT NULL DEFAULT 'UNPAID';

-- CreateTable
CREATE TABLE `refunds` (
    `id` CHAR(36) NOT NULL,
    `payment_id` CHAR(36) NOT NULL,
    `invoice_id` CHAR(36) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `reason` TEXT NOT NULL,
    `approved_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `refunds_payment_id_idx`(`payment_id`),
    INDEX `refunds_invoice_id_idx`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
