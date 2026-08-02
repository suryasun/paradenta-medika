-- CreateTable
CREATE TABLE `periodontal_assessments` (
    `id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `doctor_id` CHAR(36) NOT NULL,
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'LOCKED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `locked_at` DATETIME(3) NULL,
    `locked_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    INDEX `periodontal_assessments_visit_id_idx`(`visit_id`),
    INDEX `periodontal_assessments_patient_id_idx`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodontal_measurements` (
    `id` CHAR(36) NOT NULL,
    `assessment_id` CHAR(36) NOT NULL,
    `tooth_number` INTEGER NOT NULL,
    `measurement_point` ENUM('MB', 'B', 'DB', 'ML', 'L', 'DL') NOT NULL,
    `pocket_depth` DECIMAL(4, 1) NOT NULL,
    `gingival_margin` DECIMAL(4, 1) NOT NULL,
    `cal` DECIMAL(4, 1) NOT NULL,
    `bleeding` BOOLEAN NOT NULL DEFAULT false,
    `plaque_index` INTEGER NULL,
    `mobility` INTEGER NULL,
    `furcation` VARCHAR(5) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    INDEX `periodontal_measurements_assessment_id_idx`(`assessment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `periodontal_assessments` ADD CONSTRAINT `periodontal_assessments_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodontal_assessments` ADD CONSTRAINT `periodontal_assessments_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodontal_assessments` ADD CONSTRAINT `periodontal_assessments_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodontal_measurements` ADD CONSTRAINT `periodontal_measurements_assessment_id_fkey` FOREIGN KEY (`assessment_id`) REFERENCES `periodontal_assessments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
