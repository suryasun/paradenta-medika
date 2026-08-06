"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { RESERVATION_STATUS_TONE } from "@/features/reservation/components/ReservationListView";
import { useNewPatientReport } from "../hooks/useNewPatientReport";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const today = new Date();
const defaultFrom = new Date(today);
defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);

const PRESETS: Record<string, () => { dateFrom: string; dateTo: string }> = {
  today: () => ({ dateFrom: toDateOnly(today), dateTo: toDateOnly(today) }),
  thisWeek: () => {
    const from = new Date(today);
    from.setUTCDate(from.getUTCDate() - from.getUTCDay());
    return { dateFrom: toDateOnly(from), dateTo: toDateOnly(today) };
  },
  thisMonth: () => {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    return { dateFrom: toDateOnly(from), dateTo: toDateOnly(today) };
  },
  last30Days: () => ({ dateFrom: toDateOnly(defaultFrom), dateTo: toDateOnly(today) }),
};

// docs/06-tasks/task-291.md (Epic RE2, Reservation Module Enhancement
// addendum). Route TBD per SAD §39.7 item 3 -- placement left open pending
// a future Reporting-module navigation-depth task; this component itself
// is route-agnostic. Results table columns follow the Reservation List's
// own established gap (docs/06-tasks/task-031.md's ReservationListView.tsx
// comment): ReservationResponseDto carries doctorId (joined client-side
// against Master Data's Doctor list, same as ReservationListView) but no
// patient name/contact -- Reservation carries only patientId, and Patient
// is an unbounded list with no cheap bulk client-side join available.
export function NewPatientReportPage() {
  const [dateFrom, setDateFrom] = useState(toDateOnly(defaultFrom));
  const [dateTo, setDateTo] = useState(toDateOnly(today));
  const [page, setPage] = useState(1);

  const { data: doctorsData } = useDoctors();
  const doctorName = (id: string) => doctorsData?.items.find((d) => d.id === id)?.fullName ?? "—";

  const enabled = Boolean(dateFrom && dateTo);
  const { data, isLoading, isError, error, refetch } = useNewPatientReport({ dateFrom, dateTo, page, limit: 20 }, enabled);

  function applyPreset(preset: keyof typeof PRESETS) {
    const range = PRESETS[preset]();
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">New Patient Report</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <Select
          id="new-patient-report-preset"
          label="Preset"
          value=""
          onChange={(e) => e.target.value && applyPreset(e.target.value as keyof typeof PRESETS)}
        >
          <option value="">Custom range</option>
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="last30Days">Last 30 Days</option>
        </Select>
        <Input
          id="new-patient-report-from"
          label="From"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          id="new-patient-report-to"
          label="To"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
        {/* docs/06-tasks/task-291.md: export is explicitly deferred, never
            a client-side workaround (API-105/106) -- disabled, not hidden,
            per ui-guidelines.md §5's rule for a permission/feature gap. */}
        <Button variant="secondary" disabled title="Export isn't available yet">
          Export
        </Button>
      </div>

      {isLoading && <LoadingState label="Loading report..." rows={5} columns={5} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Total New Patients</span>
              <p className="font-tabular text-2xl font-semibold text-foreground">{data.summary.totalNewPatients.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Most Requested Procedure</span>
              <p className="text-2xl font-semibold text-foreground">{data.summary.topProcedure ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Conversion Rate</span>
              <p className="font-tabular text-2xl font-semibold text-foreground">{data.summary.conversionRate}%</p>
            </div>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Reservation No.</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Procedure</TableHeaderCell>
                <TableHeaderCell>Staff</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>{reservation.reservationNumber}</TableCell>
                  <TableCell className="font-tabular">{reservation.reservationDate}</TableCell>
                  <TableCell className="font-tabular">{reservation.startTime}</TableCell>
                  <TableCell>{reservation.reservationType}</TableCell>
                  <TableCell>{doctorName(reservation.doctorId)}</TableCell>
                  <TableCell>
                    <Badge tone={RESERVATION_STATUS_TONE[reservation.status]}>{reservation.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
