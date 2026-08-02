export interface AccountResponseDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  accountType: string;
  normalBalance: string;
  parentId: string | null;
  isPostable: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}
