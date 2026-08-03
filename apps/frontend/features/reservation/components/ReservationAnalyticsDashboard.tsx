"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { TrendChart } from "@/components/ui/TrendChart";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useReservationAnalytics } from "../hooks/useReservationAnalytics";

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-tabular text-2xl font-semibold text-foreground">{value}</span>
    </Card>
  );
}

// docs/02-design/pages/reservation.md §8: proportional bar-lists upgraded
// to real Recharts charts now that it's approved (design-system.md §11.4)
// -- each section keeps its "View as table" toggle via the shared
// TrendChart component and animates on date-range filter change (Recharts'
// own re-render + animationDuration handles the latter automatically).
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
        <h1 className="font-display text-foreground">Reservation Analytics</h1>
        <div className="flex items-end gap-3">
          <Input id="dateFrom" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input id="dateTo" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading analytics..." cards={4} />}
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
              <span className="font-tabular text-2xl font-semibold text-foreground">{(data.appointmentConversion.conversionRate * 100).toFixed(1)}%</span>
              <span className="text-xs text-muted">
                {data.appointmentConversion.completedCount} of {data.appointmentConversion.totalCount} completed
              </span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-sm text-muted">Walk-in Ratio</span>
              <span className="font-tabular text-2xl font-semibold text-foreground">{(data.walkinRatio.ratio * 100).toFixed(1)}%</span>
              <span className="text-xs text-muted">
                {data.walkinRatio.walkinCount} of {data.walkinRatio.totalCount} walk-in
              </span>
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Reservation Trend</h2>
            <TrendChart data={data.reservationTrend} xKey="date" yKey="count" />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Peak Hour Analysis</h2>
            <TrendChart data={data.peakHourAnalysis} xKey="hour" yKey="count" xLabel={(p) => `${String(p.hour).padStart(2, "0")}:00`} />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Doctor Utilization</h2>
            <TrendChart data={data.doctorUtilization} xKey="doctorId" yKey="count" xLabel={(d) => doctorName(d.doctorId)} />
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Cancellation Trend</h2>
              <TrendChart data={data.cancellationTrend} xKey="date" yKey="count" />
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-foreground">No Show Trend</h2>
              <TrendChart data={data.noShowTrend} xKey="date" yKey="count" />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
