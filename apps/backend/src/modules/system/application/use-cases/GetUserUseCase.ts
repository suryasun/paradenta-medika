import { User } from '@prisma/client';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

export class GetUserUseCase {
  constructor(private readonly userAdminRepository: IUserAdminRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userAdminRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }
}
