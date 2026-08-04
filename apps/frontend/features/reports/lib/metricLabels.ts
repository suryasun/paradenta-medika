// Hardcoded metric code -> label map. No catalog endpoint exists for
// metric metadata (confirmed) -- codes come straight from the backend's
// MetricDefinitions.ts, labels are this frontend's own presentation choice.
export const METRIC_LABELS: Record<string, string> = {
  "patient.new.count": "New Patients",
  "reservation.created.count": "Reservations Created",
  "reservation.cancelled.count": "Reservations Cancelled",
  "emr.visit.completed.count": "Visits Completed",
  "billing.collection": "Billing Collection",
  "billing.outstanding": "Outstanding Balance",
  "finance.posted-revenue": "Posted Revenue",
  "finance.posted-expense": "Posted Expense",
  "warehouse.low-stock.count": "Low Stock Items",
  "queue.count.WAITING": "Queue: Waiting",
  "queue.count.CALLED": "Queue: Called",
  "queue.count.IN_SERVICE": "Queue: In Service",
  "queue.count.COMPLETED": "Queue: Completed",
  "queue.count.CANCELLED": "Queue: Cancelled",
  "queue.count.NO_SHOW": "Queue: No Show",
  "queue.count.SKIPPED": "Queue: Skipped",
};

export function metricLabel(code: string): string {
  return METRIC_LABELS[code] ?? code;
}
