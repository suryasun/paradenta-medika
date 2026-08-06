import { IsDateString } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/** docs/06-tasks/task-291.md: dateFrom/dateTo required, plus the existing page/limit/sort/order contract. */
export class NewPatientReportQueryDto extends ListQueryDto {
  @IsDateString() dateFrom!: string;
  @IsDateString() dateTo!: string;
}
