-- CreateTable
CREATE TABLE `patient_emergency_contacts` (
    `id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `contact_name` VARCHAR(150) NOT NULL,
    `relationship` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `address` TEXT NULL,

    INDEX `patient_emergency_contacts_patient_id_idx`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_emergency_contacts` ADD CONSTRAINT `patient_emergency_contacts_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
