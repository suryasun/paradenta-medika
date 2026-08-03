-- CreateTable
CREATE TABLE `report_jobs` (
    `id` CHAR(36) NOT NULL,
    `report_name` VARCHAR(100) NOT NULL,
    `requested_by` CHAR(36) NOT NULL,
    `generated_by` CHAR(36) NULL,
    `branch_scope` JSON NOT NULL,
    `parameters_json` JSON NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'QUEUED',
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `idempotency_key` VARCHAR(150) NULL,
    `error_code` VARCHAR(50) NULL,
    `error_message_safe` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `report_jobs_idempotency_key_key`(`idempotency_key`),
    INDEX `report_jobs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_snapshots` (
    `id` CHAR(36) NOT NULL,
    `report_job_id` CHAR(36) NULL,
    `snapshot_date` DATETIME(3) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `definition_version` VARCHAR(20) NOT NULL,
    `source_watermark` VARCHAR(150) NOT NULL,
    `scope_hash` VARCHAR(100) NOT NULL,
    `payload_uri` VARCHAR(500) NULL,
    `payload_hash` VARCHAR(100) NULL,
    `row_count` INTEGER NULL,
    `schema_version` VARCHAR(20) NOT NULL,
    `retention_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_summaries` (
    `id` CHAR(36) NOT NULL,
    `metric_code` VARCHAR(100) NOT NULL,
    `branch_id` CHAR(36) NULL,
    `dimension_key` VARCHAR(150) NOT NULL DEFAULT '',
    `value` DECIMAL(18, 2) NOT NULL,
    `currency` VARCHAR(3) NULL,
    `data_as_of` DATETIME(3) NOT NULL,
    `freshness` VARCHAR(20) NOT NULL DEFAULT 'fresh',
    `definition_version` VARCHAR(20) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dashboard_summaries_metric_code_idx`(`metric_code`),
    UNIQUE INDEX `dashboard_summaries_metric_code_branch_id_dimension_key_key`(`metric_code`, `branch_id`, `dimension_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_projection_checkpoints` (
    `id` CHAR(36) NOT NULL,
    `consumer_name` VARCHAR(100) NOT NULL,
    `source_key` VARCHAR(150) NOT NULL,
    `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `report_projection_checkpoints_consumer_name_idx`(`consumer_name`),
    UNIQUE INDEX `report_projection_checkpoints_consumer_name_source_key_key`(`consumer_name`, `source_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `report_snapshots` ADD CONSTRAINT `report_snapshots_report_job_id_fkey` FOREIGN KEY (`report_job_id`) REFERENCES `report_jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
