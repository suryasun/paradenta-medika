-- CreateTable
CREATE TABLE `daily_closings` (
    `id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `cash_account_id` CHAR(36) NOT NULL,
    `cashier_id` CHAR(36) NOT NULL,
    `closing_date` DATE NOT NULL,
    `expected_balance` DECIMAL(18, 2) NOT NULL,
    `counted_balance` DECIMAL(18, 2) NOT NULL,
    `variance` DECIMAL(18, 2) NOT NULL,
    `variance_reason` TEXT NULL,
    `denominations` JSON NULL,
    `status` ENUM('SUBMITTED', 'APPROVED') NOT NULL DEFAULT 'SUBMITTED',
    `approved_by` CHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `daily_closings_branch_id_cash_account_id_cashier_id_closing__key`(`branch_id`, `cash_account_id`, `cashier_id`, `closing_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_fee_settlements` (
    `id` CHAR(36) NOT NULL,
    `settlement_no` VARCHAR(40) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `doctor_id` CHAR(36) NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `fee_account_id` CHAR(36) NOT NULL,
    `gross_amount` DECIMAL(18, 2) NOT NULL,
    `deductions` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `net_amount` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `approved_by` CHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `paid_by` CHAR(36) NULL,
    `paid_at` DATETIME(3) NULL,
    `payment_journal_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `doctor_fee_settlements_settlement_no_key`(`settlement_no`),
    UNIQUE INDEX `doctor_fee_settlements_payment_journal_id_key`(`payment_journal_id`),
    INDEX `doctor_fee_settlements_branch_id_doctor_id_status_idx`(`branch_id`, `doctor_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_fee_settlement_items` (
    `id` CHAR(36) NOT NULL,
    `settlement_id` CHAR(36) NOT NULL,
    `visit_treatment_id` CHAR(36) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `doctor_fee_settlement_items_visit_treatment_id_key`(`visit_treatment_id`),
    INDEX `doctor_fee_settlement_items_settlement_id_idx`(`settlement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `daily_closings` ADD CONSTRAINT `daily_closings_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_closings` ADD CONSTRAINT `daily_closings_cash_account_id_fkey` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_fee_settlements` ADD CONSTRAINT `doctor_fee_settlements_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_fee_settlements` ADD CONSTRAINT `doctor_fee_settlements_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_fee_settlements` ADD CONSTRAINT `doctor_fee_settlements_fee_account_id_fkey` FOREIGN KEY (`fee_account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_fee_settlements` ADD CONSTRAINT `doctor_fee_settlements_payment_journal_id_fkey` FOREIGN KEY (`payment_journal_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_fee_settlement_items` ADD CONSTRAINT `doctor_fee_settlement_items_settlement_id_fkey` FOREIGN KEY (`settlement_id`) REFERENCES `doctor_fee_settlements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
