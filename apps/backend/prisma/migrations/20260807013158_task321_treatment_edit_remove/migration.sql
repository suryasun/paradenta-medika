-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` CHAR(36) NULL,
    ADD COLUMN `visit_treatment_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `visit_treatments` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `deleted_by` CHAR(36) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` CHAR(36) NULL;

-- CreateIndex
CREATE INDEX `invoice_items_visit_treatment_id_idx` ON `invoice_items`(`visit_treatment_id`);
