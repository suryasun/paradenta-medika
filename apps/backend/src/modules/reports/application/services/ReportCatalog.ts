/**
 * docs/03-sad/20-module-report.md Section 6.3 Report Catalog -- the
 * literal 10-row table, each with its literal "typical permission".
 * `implemented: false` codes (hr.attendance, hr.payroll-register,
 * system.activity-audit) still appear in the catalog per task-185's own
 * scope ("filters the catalog... by the requester's permissions" -- not
 * "by whether it's implemented"), but GetReportUseCase returns
 * RPT_DATASET_UNAVAILABLE for them: no HR module/events exist anywhere in
 * this codebase, and the audit-log query capability is Epic AI's own
 * scope (task-192-194), not yet built.
 */
export interface ReportCatalogEntry {
  code: string;
  name: string;
  permission: string;
  ownerModule: string;
  implemented: boolean;
}

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  { code: 'operations.queue-performance', name: 'Queue Performance', permission: 'report.operations.read', ownerModule: 'queue', implemented: true },
  { code: 'clinical.visit-summary', name: 'Visit Summary', permission: 'report.clinical.read', ownerModule: 'emr', implemented: true },
  { code: 'billing.daily-summary', name: 'Billing Daily Summary', permission: 'report.billing.read', ownerModule: 'billing', implemented: true },
  { code: 'finance.trial-balance', name: 'Trial Balance', permission: 'report.finance.read', ownerModule: 'finance', implemented: true },
  { code: 'finance.income-statement', name: 'Income Statement', permission: 'report.finance.read', ownerModule: 'finance', implemented: true },
  { code: 'inventory.stock-card', name: 'Stock Card', permission: 'report.warehouse.read', ownerModule: 'warehouse', implemented: true },
  { code: 'inventory.expiry', name: 'Expiry Report', permission: 'report.warehouse.read', ownerModule: 'warehouse', implemented: true },
  { code: 'hr.attendance', name: 'HR Attendance', permission: 'report.hr.read', ownerModule: 'hr', implemented: false },
  { code: 'hr.payroll-register', name: 'Payroll Register', permission: 'report.hr.payroll.read', ownerModule: 'hr', implemented: false },
  { code: 'system.activity-audit', name: 'Activity Audit', permission: 'report.audit.read', ownerModule: 'system', implemented: false },
];

export function findReportDefinition(code: string): ReportCatalogEntry | undefined {
  return REPORT_CATALOG.find((entry) => entry.code === code);
}
