-- CreateTable
CREATE TABLE `journal_entries` (
    `id` CHAR(36) NOT NULL,
    `journal_no` VARCHAR(40) NULL,
    `branch_id` CHAR(36) NOT NULL,
    `journal_date` DATE NOT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` CHAR(36) NULL,
    `posting_type` VARCHAR(40) NULL,
    `description` VARCHAR(500) NOT NULL,
    `status` ENUM('DRAFT', 'POSTED', 'REVERSED', 'VOIDED') NOT NULL DEFAULT 'DRAFT',
    `posted_at` DATETIME(3) NULL,
    `posted_by` CHAR(36) NULL,
    `voided_at` DATETIME(3) NULL,
    `voided_by` CHAR(36) NULL,
    `void_reason` TEXT NULL,
    `reversal_of_id` CHAR(36) NULL,
    `reverse_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `journal_entries_journal_no_key`(`journal_no`),
    UNIQUE INDEX `journal_entries_reversal_of_id_key`(`reversal_of_id`),
    INDEX `journal_entries_branch_id_journal_date_status_idx`(`branch_id`, `journal_date`, `status`),
    UNIQUE INDEX `journal_entries_reference_type_reference_id_posting_type_key`(`reference_type`, `reference_id`, `posting_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_details` (
    `id` CHAR(36) NOT NULL,
    `journal_entry_id` CHAR(36) NOT NULL,
    `account_id` CHAR(36) NOT NULL,
    `debit` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `credit` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `description` VARCHAR(500) NULL,
    `cost_center_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `journal_details_account_id_journal_entry_id_idx`(`account_id`, `journal_entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_periods` (
    `id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `period_name` VARCHAR(100) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('OPEN', 'LOCKED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `locked_by` CHAR(36) NULL,
    `locked_at` DATETIME(3) NULL,
    `closed_by` CHAR(36) NULL,
    `closed_at` DATETIME(3) NULL,
    `reopened_by` CHAR(36) NULL,
    `reopened_at` DATETIME(3) NULL,
    `reopen_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    INDEX `financial_periods_branch_id_start_date_end_date_idx`(`branch_id`, `start_date`, `end_date`),
    INDEX `financial_periods_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_reversal_of_id_fkey` FOREIGN KEY (`reversal_of_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_details` ADD CONSTRAINT `journal_details_journal_entry_id_fkey` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_details` ADD CONSTRAINT `journal_details_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_periods` ADD CONSTRAINT `financial_periods_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
