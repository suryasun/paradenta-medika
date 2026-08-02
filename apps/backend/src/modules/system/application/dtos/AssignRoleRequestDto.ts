import { ArrayMinSize, ArrayUnique, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Payload per docs/03-sad/21-module-system.md Section 6.1 example, minus
 * `branchAssignments` -- Phase 1 has no user-branch relation (branch
 * assignment is explicitly Phase 4 scope, see docs/06-tasks/phase-4-plan.md).
 */
export class AssignRoleRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
