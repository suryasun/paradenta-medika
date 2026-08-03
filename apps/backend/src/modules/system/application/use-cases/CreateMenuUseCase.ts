import { Menu } from '@prisma/client';
import { IMenuRepository } from '../../domain/repositories/IMenuRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { MenuKeyExistsException } from '../../domain/exceptions/SystemExceptions';
import { CreateMenuRequestDto } from '../dtos/MenuRequestDto';

export class CreateMenuUseCase {
  constructor(
    private readonly menuRepository: IMenuRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateMenuRequestDto, actorUserId: string, auditContext: AuditContext): Promise<Menu> {
    const existing = await this.menuRepository.findByKey(input.menuKey);
    if (existing) {
      throw new MenuKeyExistsException();
    }

    const menu = await this.menuRepository.create({
      menuKey: input.menuKey,
      label: input.label,
      route: input.route,
      parentId: input.parentId,
      icon: input.icon,
      order: input.order,
      createdBy: actorUserId,
    });

    await this.auditService.record('Menu', menu.id, 'CREATE', null, { menuKey: menu.menuKey }, auditContext);

    return menu;
  }
}
