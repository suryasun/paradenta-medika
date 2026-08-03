-- CreateTable
CREATE TABLE `activity_logs` (
    `id` CHAR(36) NOT NULL,
    `actor_user_id` CHAR(36) NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `target` VARCHAR(200) NULL,
    `branch_id` CHAR(36) NULL,
    `message` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_module_idx`(`module`),
    INDEX `activity_logs_actor_user_id_idx`(`actor_user_id`),
    INDEX `activity_logs_branch_id_idx`(`branch_id`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
