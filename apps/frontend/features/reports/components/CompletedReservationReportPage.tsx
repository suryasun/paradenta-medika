"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TrendChart } from "@/components/ui/TrendChart";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useCompletedReservationReport } from "../hooks/useCompletedReservationReport";

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

// docs/06-tasks/task-299.md (Reservation Module Addendum #2, R7). Mirrors
// NewPatientReportPage.tsx's date-preset + summary-card + table shell
// (task-291 precedent), plus a TrendChart driven by summary.trend -- the
// first report in this codebase to combine that page pattern with a chart.
export function CompletedReservationReportPage() {
  const [dateFrom, setDateFrom] = useState(toDateOnly(defaultFrom));
  const [dateTo, setDateTo] = useState(toDateOnly(today));
  const [page, setPage] = useState(1);

  const { data: doctorsData } = useDoctors();
  const doctorName = (id: string) => doctorsData?.items.find((d) => d.id === id)?.fullName ?? "—";

  const enabled = Boolean(dateFrom && dateTo);
  const { data, isLoading, isError, error, refetch } = useCompletedReservationReport({ dateFrom, dateTo, page, limit: 20 }, enabled);

  function applyPreset(preset: keyof typeof PRESETS) {
    const range = PRESETS[preset]();
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Completed Reservations Report</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <Select
          id="completed-reservation-report-preset"
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
          id="completed-reservation-report-from"
          label="From"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          id="completed-reservation-report-to"
          label="To"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading && <LoadingState label="Loading report..." rows={5} columns={5} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && data && (
        <>
          <Card className="flex flex-col gap-1">
            <span className="text-sm text-muted">Total Completed</span>
            <span className="font-tabular text-2xl font-semibold text-foreground">{data.summary.totalCompleted.toLocaleString()}</span>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Completed Reservations Trend</h2>
            <TrendChart data={data.summary.trend} xKey="date" yKey="count" />
          </Card>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Reservation No.</TableHeaderCell>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Procedure</TableHeaderCell>
                <TableHeaderCell>Staff</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>{reservation.reservationNumber}</TableCell>
                  <TableCell>
                    {reservation.patientFullName ?? "—"}
                    {reservation.patientMrn && <span className="text-muted"> ({reservation.patientMrn})</span>}
                  </TableCell>
                  <TableCell className="font-tabular">{reservation.reservationDate}</TableCell>
                  <TableCell className="font-tabular">{reservation.startTime}</TableCell>
                  <TableCell>{reservation.reservationType}</TableCell>
                  <TableCell>{doctorName(reservation.doctorId)}</TableCell>
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
