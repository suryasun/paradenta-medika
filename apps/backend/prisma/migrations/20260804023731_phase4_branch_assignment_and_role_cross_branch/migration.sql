-- AlterTable
ALTER TABLE `roles` ADD COLUMN `is_cross_branch` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `system_user_branches` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `effective_from` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `system_user_branches_branch_id_idx`(`branch_id`),
    UNIQUE INDEX `system_user_branches_user_id_branch_id_key`(`user_id`, `branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `system_user_branches` ADD CONSTRAINT `system_user_branches_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_user_branches` ADD CONSTRAINT `system_user_branches_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
