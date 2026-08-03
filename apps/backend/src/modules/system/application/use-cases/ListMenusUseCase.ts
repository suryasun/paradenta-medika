import { PagedResult } from '../../../../shared/http/pagination';
import { IMenuRepository, MenuWithPermissionIds } from '../../domain/repositories/IMenuRepository';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

export class ListMenusUseCase {
  constructor(private readonly menuRepository: IMenuRepository) {}

  async execute(query: ListQueryDto): Promise<PagedResult<MenuWithPermissionIds>> {
    return this.menuRepository.list(query);
  }
}
