-- AlterTable
ALTER TABLE `branches` ADD COLUMN `mrn_prefix` VARCHAR(5) NULL;

-- AlterTable
ALTER TABLE `patients` ADD COLUMN `registered_branch_id` CHAR(36) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `branches_mrn_prefix_key` ON `branches`(`mrn_prefix`);

-- CreateIndex
CREATE INDEX `patients_registered_branch_id_registration_date_idx` ON `patients`(`registered_branch_id`, `registration_date`);

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_registered_branch_id_fkey` FOREIGN KEY (`registered_branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

