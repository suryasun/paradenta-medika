/*
  Warnings:

  - Added the required column `payload` to the `report_snapshots` table without a default value. This is not possible if the table is not empty.
  - Made the column `payload_hash` on table `report_snapshots` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `report_snapshots` ADD COLUMN `payload` JSON NOT NULL,
    MODIFY `payload_hash` VARCHAR(100) NOT NULL;

-- CreateTable
CREATE TABLE `export_artifacts` (
    `id` CHAR(36) NOT NULL,
    `report_snapshot_id` CHAR(36) NOT NULL,
    `format` VARCHAR(10) NOT NULL,
    `filename` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `content_hash` VARCHAR(100) NOT NULL,
    `retention_until` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `downloaded_at` DATETIME(3) NULL,
    `download_count` INTEGER NOT NULL DEFAULT 0,

    INDEX `export_artifacts_report_snapshot_id_idx`(`report_snapshot_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `export_artifacts` ADD CONSTRAINT `export_artifacts_report_snapshot_id_fkey` FOREIGN KEY (`report_snapshot_id`) REFERENCES `report_snapshots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
