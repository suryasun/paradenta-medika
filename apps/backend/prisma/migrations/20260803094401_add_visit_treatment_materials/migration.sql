-- CreateTable
CREATE TABLE `visit_treatment_materials` (
    `id` CHAR(36) NOT NULL,
    `visit_treatment_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `quantity` DECIMAL(18, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `visit_treatment_materials_visit_treatment_id_idx`(`visit_treatment_id`),
    INDEX `visit_treatment_materials_item_id_idx`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visit_treatment_materials` ADD CONSTRAINT `visit_treatment_materials_visit_treatment_id_fkey` FOREIGN KEY (`visit_treatment_id`) REFERENCES `visit_treatments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_treatment_materials` ADD CONSTRAINT `visit_treatment_materials_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
