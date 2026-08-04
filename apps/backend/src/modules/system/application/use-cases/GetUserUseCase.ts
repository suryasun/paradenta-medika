import { User } from '@prisma/client';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface UserWithRoleIds {
  user: User;
  roleIds: string[];
}

export class GetUserUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly userRoleRepository: IUserRoleRepository,
  ) {}

  async execute(userId: string): Promise<UserWithRoleIds> {
    const user = await this.userAdminRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    const roles = await this.userRoleRepository.listRolesForUser(userId);
    return { user, roleIds: roles.map((role) => role.id) };
  }
}
