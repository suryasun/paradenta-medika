-- CreateTable
CREATE TABLE `provinces` (
    `id` CHAR(36) NOT NULL,
    `province_code` VARCHAR(10) NOT NULL,
    `province_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `provinces_province_code_key`(`province_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regencies` (
    `id` CHAR(36) NOT NULL,
    `province_id` CHAR(36) NOT NULL,
    `regency_code` VARCHAR(10) NOT NULL,
    `regency_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `regencies_regency_code_key`(`regency_code`),
    INDEX `regencies_province_id_idx`(`province_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id` CHAR(36) NOT NULL,
    `regency_id` CHAR(36) NOT NULL,
    `district_code` VARCHAR(10) NOT NULL,
    `district_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `districts_district_code_key`(`district_code`),
    INDEX `districts_regency_id_idx`(`regency_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `villages` (
    `id` CHAR(36) NOT NULL,
    `district_id` CHAR(36) NOT NULL,
    `village_code` VARCHAR(10) NOT NULL,
    `village_name` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(10) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `villages_village_code_key`(`village_code`),
    INDEX `villages_district_id_idx`(`district_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `regencies` ADD CONSTRAINT `regencies_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `districts` ADD CONSTRAINT `districts_regency_id_fkey` FOREIGN KEY (`regency_id`) REFERENCES `regencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `villages` ADD CONSTRAINT `villages_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
