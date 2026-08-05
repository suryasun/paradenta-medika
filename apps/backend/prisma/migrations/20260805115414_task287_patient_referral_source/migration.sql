-- AlterTable
ALTER TABLE `patients` ADD COLUMN `referral_source_id` CHAR(36) NULL,
    ADD COLUMN `referred_by_user_id` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `referral_sources` (
    `id` CHAR(36) NOT NULL,
    `referral_source_code` VARCHAR(30) NOT NULL,
    `referral_source_name` VARCHAR(100) NOT NULL,
    `requires_referrer` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `referral_sources_referral_source_code_key`(`referral_source_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_referral_source_id_fkey` FOREIGN KEY (`referral_source_id`) REFERENCES `referral_sources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_referred_by_user_id_fkey` FOREIGN KEY (`referred_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
