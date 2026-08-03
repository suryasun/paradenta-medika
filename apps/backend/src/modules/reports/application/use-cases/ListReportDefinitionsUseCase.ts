import { REPORT_CATALOG, ReportCatalogEntry } from '../services/ReportCatalog';

/** docs/06-tasks/task-185.md: "Returned list excludes report codes the requester lacks permission for." */
export class ListReportDefinitionsUseCase {
  execute(requesterPermissions: string[]): ReportCatalogEntry[] {
    return REPORT_CATALOG.filter((entry) => requesterPermissions.includes(entry.permission));
  }
}
