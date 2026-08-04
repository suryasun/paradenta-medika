-- CreateTable
CREATE TABLE `masterdata_templates` (
    `id` CHAR(36) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `template_payload` JSON NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `owner_clinic_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `masterdata_template_branch_links` (
    `id` CHAR(36) NOT NULL,
    `template_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `pushed_version` INTEGER NOT NULL,
    `snapshot_payload` JSON NOT NULL,
    `current_payload` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `masterdata_template_branch_links_template_id_branch_id_key`(`template_id`, `branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `masterdata_templates` ADD CONSTRAINT `masterdata_templates_owner_clinic_id_fkey` FOREIGN KEY (`owner_clinic_id`) REFERENCES `clinics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `masterdata_template_branch_links` ADD CONSTRAINT `masterdata_template_branch_links_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `masterdata_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `masterdata_template_branch_links` ADD CONSTRAINT `masterdata_template_branch_links_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
