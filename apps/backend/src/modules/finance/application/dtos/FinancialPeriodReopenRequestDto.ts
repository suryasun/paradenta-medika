import { IsString, MinLength } from 'class-validator';

/** docs/06-tasks/task-171.md AC: "Reopen requires a mandatory reason." */
export class ReopenFinancialPeriodRequestDto {
  @IsString() @MinLength(1) reason!: string;
}
