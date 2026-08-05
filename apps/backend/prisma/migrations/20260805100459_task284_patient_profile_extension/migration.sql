-- AlterTable
ALTER TABLE `patients` ADD COLUMN `facebook_handle` VARCHAR(100) NULL,
    ADD COLUMN `instagram_handle` VARCHAR(100) NULL,
    ADD COLUMN `insurance_number` VARCHAR(50) NULL,
    ADD COLUMN `tiktok_handle` VARCHAR(100) NULL,
    ADD COLUMN `whatsapp_number` VARCHAR(30) NULL;
