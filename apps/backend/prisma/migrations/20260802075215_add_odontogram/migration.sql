-- CreateTable
CREATE TABLE `tooth_conditions` (
    `id` CHAR(36) NOT NULL,
    `condition_code` VARCHAR(30) NOT NULL,
    `condition_name` VARCHAR(100) NOT NULL,
    `category` ENUM('HEALTHY', 'DISEASE', 'RESTORATION', 'PROSTHODONTIC', 'ENDODONTIC', 'SURGICAL', 'ORTHODONTIC', 'IMPLANTOLOGY') NOT NULL,
    `color_code` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    UNIQUE INDEX `tooth_conditions_condition_code_key`(`condition_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `odontogram_entries` (
    `id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `tooth_number` INTEGER NOT NULL,
    `surface` VARCHAR(10) NULL,
    `tooth_condition_id` CHAR(36) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `odontogram_entries_patient_id_tooth_number_idx`(`patient_id`, `tooth_number`),
    INDEX `odontogram_entries_visit_id_idx`(`visit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `odontogram_entries` ADD CONSTRAINT `odontogram_entries_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `odontogram_entries` ADD CONSTRAINT `odontogram_entries_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `odontogram_entries` ADD CONSTRAINT `odontogram_entries_tooth_condition_id_fkey` FOREIGN KEY (`tooth_condition_id`) REFERENCES `tooth_conditions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
