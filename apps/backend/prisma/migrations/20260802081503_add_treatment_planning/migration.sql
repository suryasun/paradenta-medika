-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `treatment_plan_item_id` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `treatment_plan_items` (
    `id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `treatment_id` CHAR(36) NOT NULL,
    `tooth_number` INTEGER NULL,
    `surface` VARCHAR(10) NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    `estimated_cost` DECIMAL(18, 2) NOT NULL,
    `estimated_duration_minute` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `treatment_plan_items_visit_id_idx`(`visit_id`),
    INDEX `treatment_plan_items_patient_id_idx`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_treatment_plan_item_id_fkey` FOREIGN KEY (`treatment_plan_item_id`) REFERENCES `treatment_plan_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_plan_items` ADD CONSTRAINT `treatment_plan_items_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_plan_items` ADD CONSTRAINT `treatment_plan_items_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_plan_items` ADD CONSTRAINT `treatment_plan_items_treatment_id_fkey` FOREIGN KEY (`treatment_id`) REFERENCES `treatments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
