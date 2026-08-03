-- CreateTable
CREATE TABLE `system_notification_templates` (
    `id` CHAR(36) NOT NULL,
    `template_key` VARCHAR(100) NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'IN_APP') NOT NULL,
    `locale` VARCHAR(10) NOT NULL,
    `subject` VARCHAR(200) NULL,
    `body` TEXT NOT NULL,
    `variable_schema` JSON NOT NULL,
    `classification` VARCHAR(20) NOT NULL DEFAULT 'internal',
    `version` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `system_notification_templates_template_key_idx`(`template_key`),
    UNIQUE INDEX `system_notification_templates_template_key_version_key`(`template_key`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_notifications` (
    `id` CHAR(36) NOT NULL,
    `recipient_user_id` CHAR(36) NOT NULL,
    `template_id` CHAR(36) NULL,
    `channel` ENUM('EMAIL', 'SMS', 'IN_APP') NOT NULL,
    `subject` VARCHAR(200) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'READ', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
    `idempotency_key` VARCHAR(200) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_error` TEXT NULL,
    `sent_at` DATETIME(3) NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `system_notifications_idempotency_key_key`(`idempotency_key`),
    INDEX `system_notifications_recipient_user_id_idx`(`recipient_user_id`),
    INDEX `system_notifications_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `system_notifications` ADD CONSTRAINT `system_notifications_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `system_notification_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
