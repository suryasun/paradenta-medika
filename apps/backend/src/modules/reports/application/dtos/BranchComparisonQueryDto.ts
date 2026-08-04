import { IsString, MinLength } from 'class-validator';

/** docs/06-tasks/task-219.md: comma-separated branchIds, parsed/validated in GetBranchComparisonReportUseCase -- no other endpoint in this codebase accepts an array query filter, so this avoids inventing a new query-array validation convention. */
export class BranchComparisonQueryDto {
  @IsString()
  @MinLength(1)
  branchIds!: string;
}
