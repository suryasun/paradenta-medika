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
  /** Multi-branch report (accepts an array of branchIds instead of one) -- see branch.comparison below. */
  supportsMultiBranch?: boolean;
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
  // Phase 4 hardening: the three entries below are a deliberate extension of
  // this catalog beyond the literal Section 6.3 table above -- Phase 4
  // (docs/06-tasks/task-218.md/task-219.md/task-220.md) has no Section 6
  // literal spec of its own (see those tasks' own "convention-derived"
  // flags). Registering them here gives Branch Dashboard/Comparison/
  // Performance the same catalog listing + CSV export/job pipeline every
  // other implemented report already has, closing a gap where they were
  // the only reports with zero export capability that wasn't a documented,
  // deliberate limitation.
  { code: 'branch.dashboard', name: 'Branch Dashboard', permission: 'report.dashboard.branch.read', ownerModule: 'reports', implemented: true },
  { code: 'branch.comparison', name: 'Branch Comparison', permission: 'report.branch-comparison.read', ownerModule: 'reports', implemented: true, supportsMultiBranch: true },
  { code: 'branch.performance', name: 'Branch Performance', permission: 'report.branch-performance.read', ownerModule: 'reports', implemented: true },
];

export function findReportDefinition(code: string): ReportCatalogEntry | undefined {
  return REPORT_CATALOG.find((entry) => entry.code === code);
}
