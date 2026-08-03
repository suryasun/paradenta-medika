-- CreateTable
CREATE TABLE `system_background_jobs` (
    `id` CHAR(36) NOT NULL,
    `job_type` VARCHAR(100) NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'RETRYING', 'FAILED', 'CANCELLED', 'DEAD_LETTER') NOT NULL DEFAULT 'QUEUED',
    `payload_ref` VARCHAR(200) NULL,
    `idempotency_key` VARCHAR(200) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `max_attempts` INTEGER NOT NULL DEFAULT 3,
    `is_retryable` BOOLEAN NOT NULL DEFAULT true,
    `scheduled_at` DATETIME(3) NULL,
    `locked_at` DATETIME(3) NULL,
    `locked_by` VARCHAR(100) NULL,
    `last_error` TEXT NULL,
    `trace_id` CHAR(36) NULL,
    `correlation_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_background_jobs_idempotency_key_key`(`idempotency_key`),
    INDEX `system_background_jobs_status_idx`(`status`),
    INDEX `system_background_jobs_job_type_idx`(`job_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
