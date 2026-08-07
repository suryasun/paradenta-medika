-- AlterTable
ALTER TABLE `payments` ADD COLUMN `insurance_provider_id` CHAR(36) NULL,
    ADD COLUMN `payer_type` VARCHAR(20) NOT NULL DEFAULT 'PATIENT',
    ADD COLUMN `policy_number` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `insurance_providers` (
    `id` CHAR(36) NOT NULL,
    `provider_name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `payments_insurance_provider_id_idx` ON `payments`(`insurance_provider_id`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_insurance_provider_id_fkey` FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
