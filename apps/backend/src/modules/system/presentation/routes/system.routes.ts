import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../domain/services/IAuditService';
import { ISessionRepository } from '../../../auth/domain/repositories/ISessionRepository';
import { PasswordService } from '../../../auth/application/services/PasswordService';
import { ConfigService } from '../../../../shared/config/ConfigService';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { CreateUserRequestDto } from '../../application/dtos/CreateUserRequestDto';
import { UpdateUserRequestDto } from '../../application/dtos/UpdateUserRequestDto';
import { CreateRoleRequestDto } from '../../application/dtos/CreateRoleRequestDto';
import { AssignPermissionsRequestDto } from '../../application/dtos/AssignPermissionsRequestDto';
import { AssignRoleRequestDto } from '../../application/dtos/AssignRoleRequestDto';
import { RevokeSessionsRequestDto } from '../../application/dtos/RevokeSessionsRequestDto';
import { UserAdminRepository } from '../../infrastructure/repositories/UserAdminRepository';
import { RoleRepository } from '../../infrastructure/repositories/RoleRepository';
import { PermissionRepository } from '../../infrastructure/repositories/PermissionRepository';
import { RolePermissionRepository } from '../../infrastructure/repositories/RolePermissionRepository';
import { UserRoleRepository } from '../../infrastructure/repositories/UserRoleRepository';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase';
import { ActivateUserUseCase } from '../../application/use-cases/ActivateUserUseCase';
import { DeactivateUserUseCase } from '../../application/use-cases/DeactivateUserUseCase';
import { AssignRoleToUserUseCase } from '../../application/use-cases/AssignRoleToUserUseCase';
import { RevokeUserSessionsUseCase } from '../../application/use-cases/RevokeUserSessionsUseCase';
import { ListRolesUseCase } from '../../application/use-cases/ListRolesUseCase';
import { CreateRoleUseCase } from '../../application/use-cases/CreateRoleUseCase';
import { ListPermissionsUseCase } from '../../application/use-cases/ListPermissionsUseCase';
import { AssignPermissionsToRoleUseCase } from '../../application/use-cases/AssignPermissionsToRoleUseCase';
import { AuditLogQueryDto } from '../../application/dtos/AuditLogQueryDto';
import { ActivityLogQueryDto } from '../../application/dtos/ActivityLogQueryDto';
import { QueryAuditLogsUseCase } from '../../application/use-cases/QueryAuditLogsUseCase';
import { QueryActivityLogsUseCase } from '../../application/use-cases/QueryActivityLogsUseCase';
import { AuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { ActivityLogRepository } from '../../infrastructure/repositories/ActivityLogRepository';
import { UserAdminController } from '../controllers/UserAdminController';
import { RoleAdminController } from '../controllers/RoleAdminController';
import { AuditController } from '../controllers/AuditController';
import { CreateNotificationTemplateRequestDto, PreviewNotificationTemplateRequestDto } from '../../application/dtos/NotificationTemplateRequestDto';
import { ListNotificationTemplateQueryDto, ListNotificationQueryDto } from '../../application/dtos/NotificationQueryDto';
import { CreateNotificationTemplateUseCase } from '../../application/use-cases/CreateNotificationTemplateUseCase';
import { ListNotificationTemplatesUseCase } from '../../application/use-cases/ListNotificationTemplatesUseCase';
import { PreviewNotificationTemplateUseCase } from '../../application/use-cases/PreviewNotificationTemplateUseCase';
import { ListNotificationsUseCase } from '../../application/use-cases/ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../../application/use-cases/MarkNotificationReadUseCase';
import { TemplateRenderer } from '../../application/services/TemplateRenderer';
import { NotificationTemplateRepository } from '../../infrastructure/repositories/NotificationTemplateRepository';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { NotificationController } from '../controllers/NotificationController';
import { IEventBus } from '../../../../shared/events/EventBus';
import { CreateSystemParameterRequestDto } from '../../application/dtos/SystemParameterRequestDto';
import { ListSystemParameterQueryDto, ListFeatureFlagQueryDto } from '../../application/dtos/ApprovalWorkflowQueryDto';
import { CreateChangeRequestDto, RollbackParameterDto } from '../../application/dtos/ConfigurationChangeRequestDto';
import { CreateFeatureFlagRequestDto, UpdateFeatureFlagRequestDto } from '../../application/dtos/FeatureFlagRequestDto';
import { CreateMenuRequestDto, UpdateMenuPermissionsRequestDto } from '../../application/dtos/MenuRequestDto';
import { ListBackgroundJobQueryDto } from '../../application/dtos/BackgroundJobQueryDto';
import { CreateParameterUseCase } from '../../application/use-cases/CreateParameterUseCase';
import { ListParametersUseCase } from '../../application/use-cases/ListParametersUseCase';
import { ListParameterVersionsUseCase } from '../../application/use-cases/ListParameterVersionsUseCase';
import { CreateConfigurationChangeRequestUseCase } from '../../application/use-cases/CreateConfigurationChangeRequestUseCase';
import { ApproveConfigurationChangeRequestUseCase } from '../../application/use-cases/ApproveConfigurationChangeRequestUseCase';
import { RollbackParameterUseCase } from '../../application/use-cases/RollbackParameterUseCase';
import { CreateFeatureFlagUseCase } from '../../application/use-cases/CreateFeatureFlagUseCase';
import { ListFeatureFlagsUseCase } from '../../application/use-cases/ListFeatureFlagsUseCase';
import { UpdateFeatureFlagUseCase } from '../../application/use-cases/UpdateFeatureFlagUseCase';
import { CreateMenuUseCase } from '../../application/use-cases/CreateMenuUseCase';
import { ListMenusUseCase } from '../../application/use-cases/ListMenusUseCase';
import { UpdateMenuPermissionsUseCase } from '../../application/use-cases/UpdateMenuPermissionsUseCase';
import { SystemParameterRepository } from '../../infrastructure/repositories/SystemParameterRepository';
import { ConfigurationChangeRequestRepository } from '../../infrastructure/repositories/ConfigurationChangeRequestRepository';
import { FeatureFlagRepository } from '../../infrastructure/repositories/FeatureFlagRepository';
import { MenuRepository } from '../../infrastructure/repositories/MenuRepository';
import { ApprovalWorkflowController } from '../controllers/ApprovalWorkflowController';
import { ListBackgroundJobsUseCase } from '../../application/use-cases/ListBackgroundJobsUseCase';
import { GetBackgroundJobUseCase } from '../../application/use-cases/GetBackgroundJobUseCase';
import { RetryBackgroundJobUseCase } from '../../application/use-cases/RetryBackgroundJobUseCase';
import { CancelBackgroundJobUseCase } from '../../application/use-cases/CancelBackgroundJobUseCase';
import { GetOperationsHealthUseCase } from '../../application/use-cases/GetOperationsHealthUseCase';
import { BackgroundJobRepository } from '../../infrastructure/repositories/BackgroundJobRepository';
import { BackgroundJobController } from '../controllers/BackgroundJobController';

/**
 * docs/06-tasks/task-015.md..task-020.md composition root, wired against
 * docs/03-sad/21-module-system.md Section 6.1 endpoint/permission table.
 */
export function buildSystemModule(
  config: ConfigService,
  auditService: IAuditService,
  eventBus: IEventBus,
  sessionRepository: ISessionRepository,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const userAdminRepository = new UserAdminRepository();
  const roleRepository = new RoleRepository();
  const permissionRepository = new PermissionRepository();
  const rolePermissionRepository = new RolePermissionRepository();
  const userRoleRepository = new UserRoleRepository();
  const passwordService = new PasswordService(config);

  const userController = new UserAdminController(
    new CreateUserUseCase(userAdminRepository, roleRepository, userRoleRepository, passwordService, auditService),
    new ListUsersUseCase(userAdminRepository),
    new GetUserUseCase(userAdminRepository),
    new UpdateUserUseCase(userAdminRepository, auditService),
    new ActivateUserUseCase(userAdminRepository, auditService),
    new DeactivateUserUseCase(userAdminRepository, sessionRepository, auditService),
    new AssignRoleToUserUseCase(userAdminRepository, roleRepository, userRoleRepository, auditService),
    new RevokeUserSessionsUseCase(userAdminRepository, sessionRepository, auditService),
  );

  const roleController = new RoleAdminController(
    new ListRolesUseCase(roleRepository),
    new CreateRoleUseCase(roleRepository, auditService),
    new ListPermissionsUseCase(permissionRepository),
    new AssignPermissionsToRoleUseCase(roleRepository, permissionRepository, rolePermissionRepository, auditService),
  );

  // docs/06-tasks/task-192.md/task-193.md (Epic AI).
  const auditController = new AuditController(
    new QueryAuditLogsUseCase(new AuditLogRepository(), auditService),
    new QueryActivityLogsUseCase(new ActivityLogRepository()),
  );

  // docs/06-tasks/task-195.md/task-196.md/task-197.md/task-198.md (Epic AJ).
  // task-199 (SendNotificationUseCase) is an internal service with no
  // public endpoint of its own (per that task's own API Impact: "None") --
  // it is not wired into this router; wiring specific source-module
  // triggers (Reservation/Warehouse/Finance reminders) that would call it
  // is explicitly out of task-199's scope per its Definition of Done.
  const notificationTemplateRepository = new NotificationTemplateRepository();
  const notificationRepository = new NotificationRepository();
  const templateRenderer = new TemplateRenderer();
  const notificationController = new NotificationController(
    new CreateNotificationTemplateUseCase(notificationTemplateRepository, templateRenderer, auditService),
    new ListNotificationTemplatesUseCase(notificationTemplateRepository),
    new PreviewNotificationTemplateUseCase(notificationTemplateRepository, templateRenderer),
    new ListNotificationsUseCase(notificationRepository),
    new MarkNotificationReadUseCase(notificationRepository),
  );

  // docs/06-tasks/task-200.md..task-206.md (Epic AK).
  const systemParameterRepository = new SystemParameterRepository();
  const changeRequestRepository = new ConfigurationChangeRequestRepository();
  const featureFlagRepository = new FeatureFlagRepository();
  const menuRepository = new MenuRepository();
  const approvalWorkflowController = new ApprovalWorkflowController(
    new CreateParameterUseCase(systemParameterRepository, auditService),
    new ListParametersUseCase(systemParameterRepository),
    new ListParameterVersionsUseCase(systemParameterRepository),
    new CreateConfigurationChangeRequestUseCase(changeRequestRepository, auditService),
    new ApproveConfigurationChangeRequestUseCase(changeRequestRepository, systemParameterRepository, auditService, eventBus),
    new RollbackParameterUseCase(systemParameterRepository, changeRequestRepository, auditService),
    new CreateFeatureFlagUseCase(featureFlagRepository, auditService),
    new ListFeatureFlagsUseCase(featureFlagRepository),
    new UpdateFeatureFlagUseCase(featureFlagRepository, auditService),
    new CreateMenuUseCase(menuRepository, auditService),
    new ListMenusUseCase(menuRepository),
    new UpdateMenuPermissionsUseCase(menuRepository, permissionRepository, auditService),
  );

  // docs/06-tasks/task-207.md..task-209.md (Epic AL); GetOperationsHealthUseCase
  // completes task-194 (Epic AI), deferred pending this exact registry.
  const backgroundJobRepository = new BackgroundJobRepository();
  const backgroundJobController = new BackgroundJobController(
    new ListBackgroundJobsUseCase(backgroundJobRepository),
    new GetBackgroundJobUseCase(backgroundJobRepository),
    new RetryBackgroundJobUseCase(backgroundJobRepository, auditService),
    new CancelBackgroundJobUseCase(backgroundJobRepository, auditService),
    new GetOperationsHealthUseCase(backgroundJobRepository),
  );

  const router = Router();
  router.use('/system', authenticate);

  router.get('/system/users', requirePermission('system.user.read'), validateQuery(ListQueryDto), userController.list);
  router.post('/system/users', requirePermission('system.user.manage'), validateBody(CreateUserRequestDto), userController.create);
  router.get('/system/users/:userId', requirePermission('system.user.read'), userController.detail);
  router.patch('/system/users/:userId', requirePermission('system.user.manage'), validateBody(UpdateUserRequestDto), userController.update);
  router.post('/system/users/:userId/activate', requirePermission('system.user.activate'), userController.activate);
  router.post('/system/users/:userId/deactivate', requirePermission('system.user.deactivate'), userController.deactivate);
  router.post(
    '/system/users/:userId/roles',
    requirePermission('system.user.role.manage'),
    validateBody(AssignRoleRequestDto),
    userController.assignRoles,
  );
  router.post(
    '/system/users/:userId/revoke-sessions',
    requirePermission('system.user.session.revoke'),
    validateBody(RevokeSessionsRequestDto),
    userController.revokeSessions,
  );

  router.get('/system/roles', requirePermission('system.role.read'), validateQuery(ListQueryDto), roleController.listRoles);
  router.post('/system/roles', requirePermission('system.role.manage'), validateBody(CreateRoleRequestDto), roleController.createRole);
  router.get('/system/permissions', requirePermission('system.permission.read'), validateQuery(ListQueryDto), roleController.listPermissions);
  router.patch(
    '/system/roles/:roleId/permissions',
    requirePermission('system.role.permission.manage'),
    validateBody(AssignPermissionsRequestDto),
    roleController.assignPermissions,
  );

  // docs/06-tasks/task-192.md, UC-SYS-006: no update/delete route exists for
  // audit_logs anywhere in this codebase, so SYS_AUDIT_IMMUTABLE is satisfied
  // structurally -- there is no mutation endpoint to reject.
  router.get('/system/audit-logs', requirePermission('system.audit.read'), validateQuery(AuditLogQueryDto), auditController.auditLogs);
  router.get(
    '/system/activity-logs',
    requirePermission('system.activity.read'),
    validateQuery(ActivityLogQueryDto),
    auditController.activityLogs,
  );

  router.get(
    '/system/notification-templates',
    requirePermission('system.notification-template.read'),
    validateQuery(ListNotificationTemplateQueryDto),
    notificationController.listTemplates,
  );
  router.post(
    '/system/notification-templates',
    requirePermission('system.notification-template.manage'),
    validateBody(CreateNotificationTemplateRequestDto),
    notificationController.createTemplate,
  );
  router.post(
    '/system/notification-templates/:templateId/preview',
    requirePermission('system.notification-template.manage'),
    validateBody(PreviewNotificationTemplateRequestDto),
    notificationController.preview,
  );

  router.get(
    '/system/notifications',
    requirePermission('system.notification.read'),
    validateQuery(ListNotificationQueryDto),
    notificationController.listNotifications,
  );
  router.post('/system/notifications/:notificationId/read', requirePermission('system.notification.read'), notificationController.markRead);

  // docs/06-tasks/task-200.md..task-204.md (Epic AK, UC-SYS-003). No
  // literal Section 6.4-style permission table exists for these endpoints
  // (unlike Finance/Warehouse/Reporting's own Section 8.1 tables) --
  // extrapolated `system.parameter.*`/`system.config-request.*` names.
  router.get(
    '/system/parameters',
    requirePermission('system.parameter.read'),
    validateQuery(ListSystemParameterQueryDto),
    approvalWorkflowController.listParameters,
  );
  router.post(
    '/system/parameters',
    requirePermission('system.parameter.manage'),
    validateBody(CreateSystemParameterRequestDto),
    approvalWorkflowController.createParameter,
  );
  router.get(
    '/system/parameters/:parameterKey/versions',
    requirePermission('system.parameter.read'),
    validateQuery(ListQueryDto),
    approvalWorkflowController.listParameterVersions,
  );
  router.post(
    '/system/parameters/:parameterKey/change-requests',
    requirePermission('system.config-request.create'),
    validateBody(CreateChangeRequestDto),
    approvalWorkflowController.createChangeRequest,
  );
  router.post(
    '/system/configuration-change-requests/:requestId/approve',
    requirePermission('system.config-request.approve'),
    approvalWorkflowController.approveChangeRequest,
  );
  router.post(
    '/system/parameters/:parameterKey/rollback',
    requirePermission('system.config-request.create'),
    validateBody(RollbackParameterDto),
    approvalWorkflowController.rollbackParameter,
  );

  // docs/06-tasks/task-205.md (Epic AK, UC-SYS-004).
  router.get(
    '/system/feature-flags',
    requirePermission('system.feature-flag.read'),
    validateQuery(ListFeatureFlagQueryDto),
    approvalWorkflowController.listFeatureFlags,
  );
  router.post(
    '/system/feature-flags',
    requirePermission('system.feature-flag.manage'),
    validateBody(CreateFeatureFlagRequestDto),
    approvalWorkflowController.createFeatureFlag,
  );
  router.patch(
    '/system/feature-flags/:flagKey',
    requirePermission('system.feature-flag.manage'),
    validateBody(UpdateFeatureFlagRequestDto),
    approvalWorkflowController.updateFeatureFlag,
  );

  // docs/06-tasks/task-206.md (Epic AK).
  router.get('/system/menus', requirePermission('system.menu.read'), validateQuery(ListQueryDto), approvalWorkflowController.listMenus);
  router.post('/system/menus', requirePermission('system.menu.manage'), validateBody(CreateMenuRequestDto), approvalWorkflowController.createMenu);
  router.patch(
    '/system/menus/:menuId/permissions',
    requirePermission('system.menu.manage'),
    validateBody(UpdateMenuPermissionsRequestDto),
    approvalWorkflowController.updateMenuPermissions,
  );

  // docs/06-tasks/task-207.md..task-209.md (Epic AL, UC-SYS-007). No
  // literal Section 6.4-style permission table exists for these endpoints
  // -- extrapolated `system.job.*`/`system.health.read` names.
  router.get('/system/jobs', requirePermission('system.job.read'), validateQuery(ListBackgroundJobQueryDto), backgroundJobController.list);
  router.get('/system/jobs/:jobId', requirePermission('system.job.read'), backgroundJobController.detail);
  router.post('/system/jobs/:jobId/retry', requirePermission('system.job.manage'), backgroundJobController.retry);
  router.post('/system/jobs/:jobId/cancel', requirePermission('system.job.manage'), backgroundJobController.cancel);
  router.get('/system/health/operations', requirePermission('system.health.read'), backgroundJobController.operationsHealth);

  return router;
}
