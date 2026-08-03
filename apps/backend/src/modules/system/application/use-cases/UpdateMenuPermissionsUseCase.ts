import { IMenuRepository, MenuWithPermissionIds } from '../../domain/repositories/IMenuRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { MenuNotFoundException, PermissionAssignmentInvalidException } from '../../domain/exceptions/SystemExceptions';
import { UpdateMenuPermissionsRequestDto } from '../dtos/MenuRequestDto';

/** docs/06-tasks/task-206.md AC: "Menu permission mapping validated against the live permission catalog." */
export class UpdateMenuPermissionsUseCase {
  constructor(
    private readonly menuRepository: IMenuRepository,
    private readonly permissionRepository: IPermissionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(menuId: string, input: UpdateMenuPermissionsRequestDto, actorUserId: string, auditContext: AuditContext): Promise<MenuWithPermissionIds> {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) {
      throw new MenuNotFoundException();
    }

    const found = await this.permissionRepository.findByIds(input.permissionIds);
    if (found.length !== input.permissionIds.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const invalid = input.permissionIds.filter((id) => !foundIds.has(id));
      throw new PermissionAssignmentInvalidException(invalid);
    }

    const updated = await this.menuRepository.replacePermissions(menuId, input.permissionIds);

    await this.auditService.record('Menu', menuId, 'UPDATE', null, { permissionIds: input.permissionIds }, auditContext);

    return updated;
  }
}
