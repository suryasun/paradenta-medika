// Mirrors apps/backend/src/modules/system/application/dtos/UserAdminResponseDto.ts
export interface SystemUser {
  id: string;
  username: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt: string | null;
  createdAt: string;
}

// Roles/Permissions have no dedicated response DTO -- apps/backend's
// ListRolesUseCase/ListPermissionsUseCase return the raw Prisma row.
export interface Role {
  id: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  module: string;
  permissionKey: string;
  permissionName: string;
  description: string | null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  roleIds?: string[];
}

export interface CreateRoleInput {
  roleCode: string;
  roleName: string;
  description?: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Mirrors apps/backend/src/modules/system's Epic AI/AJ/AK/AL DTOs/entities
// (verified against the real route/DTO files, not docs/02-design prose).

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  userId: string | null;
  ipAddress: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorUserId: string | null;
  module: string;
  action: string;
  target: string | null;
  branchId: string | null;
  message: string;
  createdAt: string;
}

export interface OperationsHealthResult {
  queueDepth: number;
  byStatus: Record<string, number>;
  recentFailures: Array<{ id: string; jobType: string; status: string; attempts: number; lastError: string | null; traceId: string | null }>;
}

export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP";
export type NotificationStatus = "QUEUED" | "PROCESSING" | "SENT" | "DELIVERED" | "FAILED" | "READ" | "CANCELLED";

export interface NotificationTemplate {
  id: string;
  templateKey: string;
  channel: NotificationChannel;
  locale: string;
  subject: string | null;
  body: string;
  variableSchema: string[];
  classification: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  templateId: string | null;
  channel: NotificationChannel;
  subject: string | null;
  message: string;
  status: NotificationStatus;
  idempotencyKey: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface TemplatePreviewResult {
  subject?: string;
  body: string;
}

export type SystemParameterValueType = "STRING" | "INTEGER" | "DECIMAL" | "BOOLEAN" | "ENUM" | "DATE" | "DURATION" | "JSON" | "SECRET_REF";

export interface SystemParameter {
  id: string;
  key: string;
  scopeType: string;
  scopeId: string | null;
  valueType: SystemParameterValueType;
  value: string;
  version: number;
  isHighRisk: boolean;
  effectiveFrom: string;
  changeReason: string | null;
  createdAt: string;
  createdBy: string | null;
}

export type ConfigChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ConfigurationChangeRequest {
  id: string;
  parameterKey: string;
  scopeType: string;
  scopeId: string | null;
  proposedValueType: SystemParameterValueType;
  proposedValue: string;
  reason: string | null;
  isRollback: boolean;
  rollbackFromVersion: number | null;
  status: ConfigChangeRequestStatus;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  resultingVersion: number | null;
  createdAt: string;
}

export type FeatureFlagRiskClass = "standard" | "critical";

export interface FeatureFlag {
  id: string;
  flagKey: string;
  ownerModule: string;
  targetScope: string | null;
  enabled: boolean;
  riskClass: FeatureFlagRiskClass;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  reviewDate: string | null;
  description: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface Menu {
  id: string;
  menuKey: string;
  label: string;
  route: string | null;
  parentId: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface MenuWithPermissionIds extends Menu {
  permissionIds: string[];
}

export type BackgroundJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "RETRYING" | "FAILED" | "CANCELLED" | "DEAD_LETTER";

export interface BackgroundJob {
  id: string;
  jobType: string;
  status: BackgroundJobStatus;
  payloadRef: string | null;
  idempotencyKey: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  isRetryable: boolean;
  scheduledAt: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  lastError: string | null;
  traceId: string | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
}
