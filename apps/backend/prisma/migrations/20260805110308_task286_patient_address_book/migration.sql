-- CreateTable
CREATE TABLE `patient_addresses` (
    `id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `province_id` CHAR(36) NOT NULL,
    `regency_id` CHAR(36) NOT NULL,
    `district_id` CHAR(36) NOT NULL,
    `village_id` CHAR(36) NOT NULL,
    `address_line` TEXT NOT NULL,
    `postal_code` VARCHAR(10) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,

    INDEX `patient_addresses_patient_id_idx`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_addresses` ADD CONSTRAINT `patient_addresses_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_addresses` ADD CONSTRAINT `patient_addresses_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_addresses` ADD CONSTRAINT `patient_addresses_regency_id_fkey` FOREIGN KEY (`regency_id`) REFERENCES `regencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_addresses` ADD CONSTRAINT `patient_addresses_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_addresses` ADD CONSTRAINT `patient_addresses_village_id_fkey` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
