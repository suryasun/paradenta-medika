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
import { RESERVATION_STATUS_TONE } from "@/features/reservation/components/ReservationListView";
import { useReservationByStatusReport } from "../hooks/useReservationByStatusReport";
import { ReservationTrendGroupBy } from "../types/reports.types";
import { formatTrendLabel } from "../lib/trendFormat";

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

// docs/06-tasks/task-305.md (Reservation Module Addendum #4): renamed from
// CompletedReservationReportPage (task-299) -- same date-preset + summary-
// card + table + TrendChart shell, now with a Status filter (defaults to
// COMPLETED, matching the report's prior hardcoded behavior; "All Statuses"
// clears it) and a Day/Month toggle for the trend chart (task-308).
export function ReservationByStatusReportPage() {
  const [dateFrom, setDateFrom] = useState(toDateOnly(defaultFrom));
  const [dateTo, setDateTo] = useState(toDateOnly(today));
  const [status, setStatus] = useState("COMPLETED");
  const [groupBy, setGroupBy] = useState<ReservationTrendGroupBy>("day");
  const [page, setPage] = useState(1);

  const { data: doctorsData } = useDoctors();
  const doctorName = (id: string) => doctorsData?.items.find((d) => d.id === id)?.fullName ?? "—";

  const enabled = Boolean(dateFrom && dateTo);
  const { data, isLoading, isError, error, refetch } = useReservationByStatusReport(
    { dateFrom, dateTo, status, groupBy, page, limit: 20 },
    enabled,
  );

  function applyPreset(preset: keyof typeof PRESETS) {
    const range = PRESETS[preset]();
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setPage(1);
  }

  const summaryLabel = status === "ALL" ? "Total (All Statuses)" : `Total ${status}`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Reservation By Status Report</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <Select
          id="reservation-by-status-report-preset"
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
          id="reservation-by-status-report-from"
          label="From"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          id="reservation-by-status-report-to"
          label="To"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
        <Select
          id="reservation-by-status-report-status"
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All Statuses</option>
          {Object.keys(RESERVATION_STATUS_TONE).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          id="reservation-by-status-report-groupby"
          label="Group By"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as ReservationTrendGroupBy)}
        >
          <option value="day">Day</option>
          <option value="month">Month</option>
        </Select>
      </div>

      {isLoading && <LoadingState label="Loading report..." rows={5} columns={5} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && data && (
        <>
          <Card className="flex flex-col gap-1">
            <span className="text-sm text-muted">{summaryLabel}</span>
            <span className="font-tabular text-2xl font-semibold text-foreground">{data.summary.total.toLocaleString()}</span>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Reservation Trend</h2>
            <TrendChart data={data.summary.trend} xKey="date" yKey="count" xLabel={(item) => formatTrendLabel(groupBy, item.date)} />
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
