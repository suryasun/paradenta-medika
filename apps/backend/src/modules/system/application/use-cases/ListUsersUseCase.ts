import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { IUserAdminRepository, PagedResult } from '../../domain/repositories/IUserAdminRepository';
import { User } from '@prisma/client';

export class ListUsersUseCase {
  constructor(private readonly userAdminRepository: IUserAdminRepository) {}

  async execute(query: ListQueryDto): Promise<PagedResult<User>> {
    return this.userAdminRepository.list(query);
  }
}
