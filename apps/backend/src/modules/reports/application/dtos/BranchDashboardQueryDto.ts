import { IsUUID } from 'class-validator';

/** docs/06-tasks/task-218.md: unlike DashboardQueryDto's optional branchId, this dashboard is inherently single-branch. */
export class BranchDashboardQueryDto {
  @IsUUID('4') branchId!: string;
}
