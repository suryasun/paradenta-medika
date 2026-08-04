import { IsBoolean } from 'class-validator';

export class UpdateRoleBranchPolicyRequestDto {
  @IsBoolean()
  isCrossBranch!: boolean;
}
