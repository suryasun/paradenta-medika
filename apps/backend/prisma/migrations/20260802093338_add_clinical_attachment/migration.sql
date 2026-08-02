-- CreateTable
CREATE TABLE `attachments` (
    `id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `category` ENUM('CLINICAL_PHOTOGRAPHY', 'X_RAY', 'CBCT', 'CONSENT', 'PDF', 'VIDEO', 'OTHER') NOT NULL,
    `attachment_type` VARCHAR(100) NULL,
    `current_version_id` CHAR(36) NULL,
    `archived_at` DATETIME(3) NULL,
    `archived_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    UNIQUE INDEX `attachments_current_version_id_key`(`current_version_id`),
    INDEX `attachments_visit_id_idx`(`visit_id`),
    INDEX `attachments_patient_id_idx`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attachment_versions` (
    `id` CHAR(36) NOT NULL,
    `attachment_id` CHAR(36) NOT NULL,
    `version_number` INTEGER NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `stored_name` VARCHAR(255) NOT NULL,
    `extension` VARCHAR(20) NOT NULL,
    `mime_type` VARCHAR(150) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `bucket` VARCHAR(100) NOT NULL,
    `object_key` VARCHAR(500) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    UNIQUE INDEX `attachment_versions_attachment_id_version_number_key`(`attachment_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attachment_annotations` (
    `id` CHAR(36) NOT NULL,
    `attachment_id` CHAR(36) NOT NULL,
    `shape` VARCHAR(30) NOT NULL,
    `position_x` DOUBLE NOT NULL,
    `position_y` DOUBLE NOT NULL,
    `width` DOUBLE NULL,
    `height` DOUBLE NULL,
    `text` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `attachment_annotations_attachment_id_idx`(`attachment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_current_version_id_fkey` FOREIGN KEY (`current_version_id`) REFERENCES `attachment_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachment_versions` ADD CONSTRAINT `attachment_versions_attachment_id_fkey` FOREIGN KEY (`attachment_id`) REFERENCES `attachments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachment_annotations` ADD CONSTRAINT `attachment_annotations_attachment_id_fkey` FOREIGN KEY (`attachment_id`) REFERENCES `attachments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
