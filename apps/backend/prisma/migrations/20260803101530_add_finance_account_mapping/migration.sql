-- CreateTable
CREATE TABLE `finance_account_mappings` (
    `id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `payment_method_id` CHAR(36) NOT NULL,
    `cash_account_id` CHAR(36) NOT NULL,
    `revenue_account_id` CHAR(36) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    INDEX `finance_account_mappings_payment_method_id_idx`(`payment_method_id`),
    INDEX `finance_account_mappings_cash_account_id_idx`(`cash_account_id`),
    INDEX `finance_account_mappings_revenue_account_id_idx`(`revenue_account_id`),
    UNIQUE INDEX `finance_account_mappings_branch_id_payment_method_id_key`(`branch_id`, `payment_method_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `finance_account_mappings` ADD CONSTRAINT `finance_account_mappings_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_account_mappings` ADD CONSTRAINT `finance_account_mappings_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_account_mappings` ADD CONSTRAINT `finance_account_mappings_cash_account_id_fkey` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_account_mappings` ADD CONSTRAINT `finance_account_mappings_revenue_account_id_fkey` FOREIGN KEY (`revenue_account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
