-- CreateTable
CREATE TABLE `cash_accounts` (
    `id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `account_type` ENUM('CASH', 'BANK', 'CLEARING') NOT NULL,
    `ledger_account_id` CHAR(36) NOT NULL,
    `account_number` VARCHAR(100) NULL,
    `current_balance` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    INDEX `cash_accounts_ledger_account_id_idx`(`ledger_account_id`),
    UNIQUE INDEX `cash_accounts_branch_id_code_key`(`branch_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` CHAR(36) NOT NULL,
    `expense_no` VARCHAR(40) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `expense_date` DATE NOT NULL,
    `category` VARCHAR(30) NOT NULL,
    `expense_account_id` CHAR(36) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `approved_amount` DECIMAL(18, 2) NULL,
    `paid_amount` DECIMAL(18, 2) NULL,
    `payee_name` VARCHAR(150) NULL,
    `description` TEXT NULL,
    `evidence_url` VARCHAR(500) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `submitted_at` DATETIME(3) NULL,
    `approved_by` CHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_by` CHAR(36) NULL,
    `rejected_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `paid_by` CHAR(36) NULL,
    `paid_at` DATETIME(3) NULL,
    `payment_journal_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `expenses_expense_no_key`(`expense_no`),
    UNIQUE INDEX `expenses_payment_journal_id_key`(`payment_journal_id`),
    INDEX `expenses_branch_id_expense_date_status_idx`(`branch_id`, `expense_date`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cash_accounts` ADD CONSTRAINT `cash_accounts_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_accounts` ADD CONSTRAINT `cash_accounts_ledger_account_id_fkey` FOREIGN KEY (`ledger_account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_expense_account_id_fkey` FOREIGN KEY (`expense_account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_payment_journal_id_fkey` FOREIGN KEY (`payment_journal_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
