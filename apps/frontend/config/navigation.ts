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
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "report.dashboard.operations.read" },
  { label: "Patients", href: "/patients", permission: "patient.read" },
  { label: "Reservations", href: "/reservations", permission: "reservation.read" },
  { label: "Queue", href: "/queue", permission: "queue.read" },
  // No standalone EMR sidebar entry: apps/backend has no Visit List
  // endpoint (docs/06-tasks/task-048.md..053.md never add one) -- a Visit
  // is only ever reached via Queue's "Open Visit" action on a CALLED entry.
  { label: "Billing", href: "/billing", permission: "billing.invoice.read" },
];
