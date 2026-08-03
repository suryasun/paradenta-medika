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

/**
 * docs/06-tasks/task-015.md..task-020.md composition root, wired against
 * docs/03-sad/21-module-system.md Section 6.1 endpoint/permission table.
 */
export function buildSystemModule(
  config: ConfigService,
  auditService: IAuditService,
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

  return router;
}
