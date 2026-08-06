"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-client";
import { useReservations } from "../hooks/useReservations";
import { ListReservationsParams, Reservation } from "../types/reservation.types";
import { RESERVATION_STATUS_TONE } from "./ReservationListView";

const RESERVATION_TYPES: Reservation["reservationType"][] = ["APPOINTMENT", "WALK_IN", "FOLLOW_UP", "EMERGENCY", "CONSULTATION"];
const CANCELLED_OR_NO_SHOW: Reservation["status"][] = ["CANCELLED", "NO_SHOW"];

function summarize(items: Reservation[]) {
  const completed = items.filter((r) => r.status === "COMPLETED").length;
  const cancelledOrNoShow = items.filter((r) => CANCELLED_OR_NO_SHOW.includes(r.status)).length;
  const newPatientCount = items.filter((r) => r.patientType === "NEW").length;
  const newPatientPercent = items.length > 0 ? Math.round((newPatientCount / items.length) * 100) : 0;
  return { completed, cancelledOrNoShow, newPatientPercent };
}

function ReservationHistoryCard({ reservation }: { reservation: Reservation }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* task-296 (Reservation Module Addendum #2, R1): patient name/MRN
              now returned directly by GET /reservations. */}
          <span className="font-medium text-foreground">{reservation.patientFullName ?? reservation.reservationNumber}</span>
          {reservation.patientMrn && <span className="text-sm text-muted">({reservation.patientMrn})</span>}
          <Badge tone={reservation.patientType === "NEW" ? "info" : "neutral"}>{reservation.patientType}</Badge>
        </div>
        <span className="text-sm text-muted">
          {reservation.reservationNumber} &middot; {reservation.reservationDate} &middot; {reservation.startTime} &middot; {reservation.reservationType}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={RESERVATION_STATUS_TONE[reservation.status]}>{reservation.status}</Badge>
        {/* task-294.md Frontend Scope: kept as two labeled actions per the
            source brief's reference, both routing to the same Reservation
            Detail page -- flagged there as a likely single-action
            simplification opportunity, since no functional difference
            between them is documented. */}
        <Link href={`/reservations/${reservation.id}`} className="text-sm font-medium text-primary hover:underline">
          View Appointment Details
        </Link>
        <Link href={`/reservations/${reservation.id}`} className="text-sm font-medium text-primary hover:underline">
          View Full Reservation
        </Link>
      </div>
    </div>
  );
}

// docs/06-tasks/task-294.md (Epic RE5, Reservation Module Enhancement
// addendum). Clinic-wide, distinct from the existing per-patient
// Reservation History tab on Patient Detail. No "Care Plan History" screen
// exists anywhere in this product (docs/03-sad/13-module-reservation.md
// §39.6 item 3) -- this screen is designed fresh, not copied from one.
// docs/06-tasks/task-298.md (Reservation Module Addendum #2, R5/R6): the
// mirror image of ReservationListView's todayIso() -- History is strictly
// *before* today, so its default/max upper bound is yesterday, not today
// (today's own reservations belong to the List screen, not History).
function yesterdayIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function ReservationHistoryPage() {
  const [filters, setFilters] = useState<ListReservationsParams>({ page: 1, limit: 20, dateTo: yesterdayIso() });
  const { data, isLoading, isError, error, refetch } = useReservations(filters);

  const summary = summarize(data?.items ?? []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground">Reservation History</h1>

      {/* task-294.md Backend Scope: client-side aggregation over the
          fetched page, not a dedicated backend summary endpoint, per this
          task's own initial-scope note. */}
      <p className="text-sm text-muted">
        {summary.completed} completed &middot; {summary.cancelledOrNoShow} cancelled/no-show &middot; {summary.newPatientPercent}% new patients
      </p>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search patient name or procedure..."
          value={filters.search ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined, page: 1 }))}
          className="w-64"
        />
        <Select value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}>
          <option value="">All statuses</option>
          {Object.keys(RESERVATION_STATUS_TONE).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select
          value={filters.patientType ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, patientType: (e.target.value || undefined) as "NEW" | "OLD" | undefined, page: 1 }))}
        >
          <option value="">All patients</option>
          <option value="NEW">New</option>
          <option value="OLD">Old</option>
        </Select>
        <Select
          value={filters.reservationType ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, reservationType: e.target.value || undefined, page: 1 }))}
        >
          <option value="">All procedures</option>
          {RESERVATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          aria-label="Date from"
          max={yesterdayIso()}
          value={filters.dateFrom ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined, page: 1 }))}
        />
        <Input
          type="date"
          aria-label="Date to"
          max={yesterdayIso()}
          value={filters.dateTo ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || yesterdayIso(), page: 1 }))}
        />
      </div>

      {isLoading && <LoadingState label="Loading reservation history..." rows={5} columns={4} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState title="No reservations found" description="Try adjusting your search or filters." />
      )}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.items.map((reservation) => (
            <ReservationHistoryCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
      {data && <Pagination meta={data.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  );
}
