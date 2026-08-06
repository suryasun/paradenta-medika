// docs/02-design/navigation.md Section 1 documents that navigation should
// be driven by a Menu domain aggregate (GET /system/menus) managed through
// System Administration -- but no Phase 1 task builds that Menu backend
// (checked docs/06-tasks/phase-1-plan.md: no Menu CRUD task exists). Static
// navigation here, filtered client-side by permission (UX convenience only,
// per navigation.md: "Menu visibility is convenience; API/domain policy is
// the authority" -- real enforcement is the backend's requirePermission
// middleware), is a documented substitute until that aggregate exists.
// Sections mirror navigation.md Section 2's Top-Level IA, limited to
// modules actually built in Phase 1.
export interface NavItem {
  label: string;
  href: string;
  /** Permission code gating visibility; omit for items visible to any authenticated user. */
  permission?: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "report.dashboard.operations.read" },
  { label: "Patients", href: "/patients", permission: "patient.read" },
  {
    label: "Reservations",
    href: "/reservations",
    permission: "reservation.read",
    children: [
      { label: "List", href: "/reservations", permission: "reservation.read" },
      { label: "Calendar", href: "/reservations/calendar", permission: "reservation.read" },
      { label: "History", href: "/reservations/history", permission: "reservation.read" },
      { label: "Analytics", href: "/reservations/analytics", permission: "reservation.analytics.read" },
    ],
  },
  { label: "Queue", href: "/queue", permission: "queue.read" },
  // No standalone EMR sidebar entry: apps/backend has no Visit List
  // endpoint (docs/06-tasks/task-048.md..053.md never add one) -- a Visit
  // is only ever reached via Queue's "Open Visit" action on a CALLED entry.
  { label: "Billing", href: "/billing", permission: "billing.invoice.read" },
  {
    label: "Dashboards",
    href: "/reports/dashboards/executive",
    permission: "report.dashboard.executive.read",
    children: [
      { label: "Executive", href: "/reports/dashboards/executive", permission: "report.dashboard.executive.read" },
      { label: "Operations", href: "/reports/dashboards/operations", permission: "report.dashboard.operations.read" },
      { label: "Clinical", href: "/reports/dashboards/clinical", permission: "report.dashboard.clinical.read" },
      { label: "Finance", href: "/reports/dashboards/finance", permission: "report.dashboard.finance.read" },
      { label: "Warehouse", href: "/reports/dashboards/warehouse", permission: "report.dashboard.warehouse.read" },
      { label: "Branch", href: "/reports/dashboards/branch", permission: "report.dashboard.branch.read" },
    ],
  },
  {
    label: "Reports",
    href: "/reports/catalog",
    permission: "report.catalog.read",
    children: [
      { label: "Catalog", href: "/reports/catalog", permission: "report.catalog.read" },
      { label: "Branch Comparison", href: "/reports/branch-comparison", permission: "report.branch-comparison.read" },
      { label: "Branch Performance", href: "/reports/branch-performance", permission: "report.branch-performance.read" },
      { label: "New Patients", href: "/reports/new-patients", permission: "report.reservation.new-patient.read" },
    ],
  },
  {
    label: "Master Data",
    href: "/master-data/clinics",
    permission: "masterdata.clinic.read",
    children: [
      { label: "Clinics", href: "/master-data/clinics", permission: "masterdata.clinic.read" },
      { label: "Branches", href: "/master-data/branches", permission: "masterdata.branch.read" },
      { label: "Doctors", href: "/master-data/doctors", permission: "masterdata.doctor.read" },
      { label: "Treatment Categories", href: "/master-data/treatment-categories", permission: "masterdata.treatment-category.read" },
      { label: "Treatments", href: "/master-data/treatments", permission: "masterdata.treatment.read" },
      { label: "Payment Methods", href: "/master-data/payment-methods", permission: "masterdata.payment-method.read" },
      { label: "Tooth Conditions", href: "/master-data/tooth-conditions", permission: "masterdata.tooth-condition.read" },
      { label: "Consent Templates", href: "/master-data/consent-templates", permission: "emr.consent-template.read" },
      { label: "Templates", href: "/master-data/templates", permission: "masterdata.template.read" },
    ],
  },
  {
    label: "Warehouse",
    href: "/warehouse/stocks",
    permission: "warehouse.stock.read",
    children: [
      { label: "Items", href: "/warehouse/items", permission: "warehouse.item.read" },
      { label: "Suppliers", href: "/warehouse/suppliers", permission: "warehouse.supplier.read" },
      { label: "Locations", href: "/warehouse/locations", permission: "warehouse.location.read" },
      { label: "Stock", href: "/warehouse/stocks", permission: "warehouse.stock.read" },
      { label: "Purchase Orders", href: "/warehouse/purchase-orders", permission: "warehouse.purchase.read" },
      { label: "Stock Transfer", href: "/warehouse/transfers", permission: "warehouse.stock.transfer" },
      { label: "Stock Adjustment", href: "/warehouse/adjustments", permission: "warehouse.stock.adjust" },
      { label: "Stock Opname", href: "/warehouse/stock-opnames", permission: "warehouse.opname.read" },
      { label: "Batches", href: "/warehouse/batches", permission: "warehouse.batch.read" },
      { label: "Reports", href: "/warehouse/reports", permission: "warehouse.report.read" },
    ],
  },
  {
    label: "Finance",
    href: "/finance/journals",
    permission: "finance.journal.read",
    children: [
      { label: "Chart of Accounts", href: "/finance/accounts", permission: "finance.account.read" },
      { label: "Journal", href: "/finance/journals", permission: "finance.journal.read" },
      { label: "Financial Period", href: "/finance/periods", permission: "finance.period.read" },
      { label: "Cash & Bank Accounts", href: "/finance/cash-accounts", permission: "finance.cash.read" },
      { label: "Cash Movements", href: "/finance/cash-movements", permission: "finance.cash.read" },
      { label: "Cash Transfer", href: "/finance/cash-transfers", permission: "finance.cash.transfer" },
      { label: "Daily Cash Closing", href: "/finance/daily-closings", permission: "finance.cash.read" },
      { label: "Expenses", href: "/finance/expenses", permission: "finance.expense.read" },
      { label: "Doctor Fee Settlement", href: "/finance/doctor-fee-settlements", permission: "finance.settlement.generate" },
      { label: "Account Mappings", href: "/finance/account-mappings", permission: "finance.account-mapping.read" },
      { label: "Reports", href: "/finance/reports", permission: "finance.report.read" },
    ],
  },
  {
    label: "System",
    href: "/system/users",
    permission: "system.user.read",
    children: [
      { label: "Users", href: "/system/users", permission: "system.user.read" },
      { label: "Roles", href: "/system/roles", permission: "system.role.read" },
      { label: "Role-Branch Matrix", href: "/system/roles/branch-matrix", permission: "system.role.read" },
      { label: "Audit Log", href: "/system/audit-logs", permission: "system.audit.read" },
      { label: "Activity Log", href: "/system/activity-logs", permission: "system.activity.read" },
      { label: "Operations Health", href: "/system/operations-health", permission: "system.health.read" },
      { label: "Notifications", href: "/system/notifications", permission: "system.notification.read" },
      { label: "Notification Templates", href: "/system/notification-templates", permission: "system.notification-template.read" },
      { label: "System Parameters", href: "/system/parameters", permission: "system.parameter.read" },
      { label: "Feature Flags", href: "/system/feature-flags", permission: "system.feature-flag.read" },
      { label: "Menus", href: "/system/menus", permission: "system.menu.read" },
      { label: "Background Jobs", href: "/system/jobs", permission: "system.job.read" },
    ],
  },
];
