import { UserBranch } from '@prisma/client';

export interface UserBranchResponseDto {
  id: string;
  branchId: string;
  isDefault: boolean;
  effectiveFrom: Date | null;
}

export function toUserBranchResponse(userBranch: UserBranch): UserBranchResponseDto {
  return {
    id: userBranch.id,
    branchId: userBranch.branchId,
    isDefault: userBranch.isDefault,
    effectiveFrom: userBranch.effectiveFrom,
  };
}
