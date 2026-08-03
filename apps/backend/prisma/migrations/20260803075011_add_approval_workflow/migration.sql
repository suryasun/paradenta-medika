-- CreateTable
CREATE TABLE `system_parameters` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(150) NOT NULL,
    `scope_type` VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
    `scope_id` CHAR(36) NULL,
    `value_type` ENUM('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'ENUM', 'DATE', 'DURATION', 'JSON', 'SECRET_REF') NOT NULL,
    `value` TEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `is_high_risk` BOOLEAN NOT NULL DEFAULT false,
    `effective_from` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `change_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    INDEX `system_parameters_key_idx`(`key`),
    UNIQUE INDEX `system_parameters_key_scope_type_scope_id_version_key`(`key`, `scope_type`, `scope_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configuration_change_requests` (
    `id` CHAR(36) NOT NULL,
    `parameter_key` VARCHAR(150) NOT NULL,
    `scope_type` VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
    `scope_id` CHAR(36) NULL,
    `proposed_value_type` ENUM('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'ENUM', 'DATE', 'DURATION', 'JSON', 'SECRET_REF') NOT NULL,
    `proposed_value` TEXT NOT NULL,
    `reason` TEXT NULL,
    `is_rollback` BOOLEAN NOT NULL DEFAULT false,
    `rollback_from_version` INTEGER NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requested_by` CHAR(36) NOT NULL,
    `approved_by` CHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_by` CHAR(36) NULL,
    `rejected_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `resulting_version` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `system_configuration_change_requests_parameter_key_idx`(`parameter_key`),
    INDEX `system_configuration_change_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_feature_flags` (
    `id` CHAR(36) NOT NULL,
    `flag_key` VARCHAR(100) NOT NULL,
    `owner_module` VARCHAR(50) NOT NULL,
    `target_scope` VARCHAR(200) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `risk_class` VARCHAR(20) NOT NULL DEFAULT 'standard',
    `effective_from` DATETIME(3) NULL,
    `effective_until` DATETIME(3) NULL,
    `review_date` DATETIME(3) NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `system_feature_flags_flag_key_key`(`flag_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_menus` (
    `id` CHAR(36) NOT NULL,
    `menu_key` VARCHAR(100) NOT NULL,
    `label` VARCHAR(150) NOT NULL,
    `route` VARCHAR(200) NULL,
    `parent_id` CHAR(36) NULL,
    `icon` VARCHAR(50) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` CHAR(36) NULL,

    UNIQUE INDEX `system_menus_menu_key_key`(`menu_key`),
    INDEX `system_menus_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_menu_permissions` (
    `id` CHAR(36) NOT NULL,
    `menu_id` CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,

    UNIQUE INDEX `system_menu_permissions_menu_id_permission_id_key`(`menu_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `system_menus` ADD CONSTRAINT `system_menus_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `system_menus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_menu_permissions` ADD CONSTRAINT `system_menu_permissions_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `system_menus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_menu_permissions` ADD CONSTRAINT `system_menu_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
