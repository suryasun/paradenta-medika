"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useReservationAnalytics } from "../hooks/useReservationAnalytics";
import { DateCountPoint, DoctorUtilizationEntry, HourCountPoint } from "../types/reservation.types";

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
    </Card>
  );
}

function BarList<T>({ items, keyFn, labelFn, countFn }: { items: T[]; keyFn: (item: T) => string; labelFn: (item: T) => string; countFn: (item: T) => number }) {
  if (items.length === 0) return <EmptyState title="No data for this range" />;
  const max = Math.max(...items.map(countFn), 1);
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={keyFn(item)} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 text-muted">{labelFn(item)}</span>
          <div className="h-2 flex-1 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(countFn(item) / max) * 100}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right font-medium text-foreground">{countFn(item)}</span>
        </li>
      ))}
    </ul>
  );
}

// docs/06-tasks/task-060.md: no docs/02-design/ page spec exists (documented
// gap). No charting library is approved for the frontend (per
// docs/04-ai-contract/01-global-rules.md: no new library without explicit
// approval), so trends/distributions render as simple proportional bar
// lists rather than a chart.
export function ReservationAnalyticsDashboard() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: doctorsData } = useDoctors();
  const { data, isLoading, isError, error, refetch } = useReservationAnalytics({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const doctorName = (id: string) => doctorsData?.items.find((d) => d.id === id)?.fullName ?? id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Reservation Analytics</h1>
        <div className="flex items-end gap-3">
          <Input id="dateFrom" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input id="dateTo" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading analytics..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {data && (
        <>
          <p className="text-sm text-muted">
            Range: {data.dateRange.from} to {data.dateRange.to}
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="Total Reservations" value={data.kpi.totalReservations} />
            <KpiCard label="Daily Reservations" value={data.kpi.dailyReservations} />
            <KpiCard label="Weekly Reservations" value={data.kpi.weeklyReservations} />
            <KpiCard label="Monthly Reservations" value={data.kpi.monthlyReservations} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="flex flex-col gap-1">
              <span className="text-sm text-muted">Appointment Conversion</span>
              <span className="text-2xl font-semibold text-foreground">{(data.appointmentConversion.conversionRate * 100).toFixed(1)}%</span>
              <span className="text-xs text-muted">
                {data.appointmentConversion.completedCount} of {data.appointmentConversion.totalCount} completed
              </span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-sm text-muted">Walk-in Ratio</span>
              <span className="text-2xl font-semibold text-foreground">{(data.walkinRatio.ratio * 100).toFixed(1)}%</span>
              <span className="text-xs text-muted">
                {data.walkinRatio.walkinCount} of {data.walkinRatio.totalCount} walk-in
              </span>
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Reservation Trend</h2>
            <BarList<DateCountPoint> items={data.reservationTrend} keyFn={(p) => p.date} labelFn={(p) => p.date} countFn={(p) => p.count} />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Peak Hour Analysis</h2>
            <BarList<HourCountPoint>
              items={data.peakHourAnalysis}
              keyFn={(p) => String(p.hour)}
              labelFn={(p) => `${String(p.hour).padStart(2, "0")}:00`}
              countFn={(p) => p.count}
            />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Doctor Utilization</h2>
            <BarList<DoctorUtilizationEntry>
              items={data.doctorUtilization}
              keyFn={(d) => d.doctorId}
              labelFn={(d) => doctorName(d.doctorId)}
              countFn={(d) => d.count}
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Cancellation Trend</h2>
              <BarList<DateCountPoint> items={data.cancellationTrend} keyFn={(p) => p.date} labelFn={(p) => p.date} countFn={(p) => p.count} />
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-foreground">No Show Trend</h2>
              <BarList<DateCountPoint> items={data.noShowTrend} keyFn={(p) => p.date} labelFn={(p) => p.date} countFn={(p) => p.count} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
