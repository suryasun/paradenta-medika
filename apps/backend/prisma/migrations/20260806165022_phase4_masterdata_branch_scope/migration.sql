-- DropIndex
DROP INDEX `payment_methods_method_code_key` ON `payment_methods`;

-- DropIndex
DROP INDEX `tooth_conditions_condition_code_key` ON `tooth_conditions`;

-- DropIndex
DROP INDEX `treatments_treatment_code_key` ON `treatments`;

-- AlterTable
ALTER TABLE `masterdata_template_branch_links` ADD COLUMN `applied_entity_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `payment_methods` ADD COLUMN `branch_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `tooth_conditions` ADD COLUMN `branch_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `treatments` ADD COLUMN `branch_id` CHAR(36) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payment_methods_branch_id_method_code_key` ON `payment_methods`(`branch_id`, `method_code`);

-- CreateIndex
CREATE UNIQUE INDEX `tooth_conditions_branch_id_condition_code_key` ON `tooth_conditions`(`branch_id`, `condition_code`);

-- CreateIndex
CREATE UNIQUE INDEX `treatments_branch_id_treatment_code_key` ON `treatments`(`branch_id`, `treatment_code`);

-- AddForeignKey
ALTER TABLE `treatments` ADD CONSTRAINT `treatments_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tooth_conditions` ADD CONSTRAINT `tooth_conditions_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

