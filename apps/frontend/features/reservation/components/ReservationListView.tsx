"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useReservations } from "../hooks/useReservations";
import { useCheckInReservation } from "../hooks/useReservationMutations";
import { ListReservationsParams, Reservation } from "../types/reservation.types";

export const RESERVATION_STATUS_TONE: Record<Reservation["status"], "neutral" | "success" | "warning" | "error" | "info"> = {
  BOOKED: "info",
  CONFIRMED: "info",
  CHECK_IN: "warning",
  IN_QUEUE: "warning",
  IN_SERVICE: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "error",
};

// docs/02-design/pages/reservation.md §2.1: the list was missing 5 of SAD
// §33.3's 10 spec'd columns. Doctor is joined client-side against Master
// Data's own already-fetched Doctor list, same pattern CreateReservationForm
// already uses. Patient Name/MRN (task-296, Reservation Module Addendum #2
// R1) are now returned directly by GET /reservations (a lightweight
// server-side snapshot, not a client-side join -- Patient is an unbounded
// list, unlike the small Doctor roster).
function ReservationRow({ reservation, doctorName }: { reservation: Reservation; doctorName: string }) {
  const checkInReservation = useCheckInReservation(reservation.id);
  const canCheckIn = reservation.status === "BOOKED" || reservation.status === "CONFIRMED";

  return (
    <TableRow>
      <TableCell>{reservation.reservationNumber}</TableCell>
      <TableCell>
        {reservation.patientFullName ?? "—"}
        {reservation.patientMrn && <span className="text-muted"> ({reservation.patientMrn})</span>}
      </TableCell>
      <TableCell className="font-tabular">{reservation.reservationDate}</TableCell>
      <TableCell className="font-tabular">{reservation.startTime}</TableCell>
      <TableCell>{doctorName}</TableCell>
      <TableCell>{reservation.reservationType}</TableCell>
      <TableCell>
        <Badge tone={RESERVATION_STATUS_TONE[reservation.status]}>{reservation.status}</Badge>
      </TableCell>
      <TableCell>
        <Badge tone={reservation.patientType === "NEW" ? "info" : "neutral"}>{reservation.patientType}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Link href={`/reservations/${reservation.id}`} className="text-sm font-medium text-primary hover:underline">
            View
          </Link>
          {canCheckIn && (
            <PermissionGuard permission="reservation.check-in">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                disabled={checkInReservation.isPending}
                onClick={() => checkInReservation.mutate()}
              >
                Check In
              </button>
            </PermissionGuard>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// docs/06-tasks/task-298.md (Reservation Module Addendum #2, R5/R6): the
// List/History split is by reservationDate relative to today, not status --
// List = today and onward ("now and next"), History = strictly before
// today. UTC-day-truncated, matching the existing convention already used
// by useReservations/ReservationAnalyticsUseCase.
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReservationListView() {
  const [filters, setFilters] = useState<ListReservationsParams>({ page: 1, limit: 20, dateFrom: todayIso() });
  const { data, isLoading, isError, error, refetch } = useReservations(filters);
  const { data: doctorsData } = useDoctors();
  const doctorName = (id: string) => doctorsData?.items.find((d) => d.id === id)?.fullName ?? "—";

  const newReservationAction = (
    <PermissionGuard permission="reservation.create">
      <Link href="/reservations/new">
        <Button>New Reservation</Button>
      </Link>
    </PermissionGuard>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Reservations</h1>
        {newReservationAction}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search reservation no. / complaint..."
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
        <Input
          type="date"
          min={todayIso()}
          value={filters.dateFrom ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || todayIso(), page: 1 }))}
        />
        <Input
          type="date"
          min={todayIso()}
          value={filters.dateTo ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined, page: 1 }))}
        />
        {/* task-290 (Epic RE1) */}
        <Select
          value={filters.patientType ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, patientType: (e.target.value || undefined) as "NEW" | "OLD" | undefined, page: 1 }))}
        >
          <option value="">All patients</option>
          <option value="NEW">New</option>
          <option value="OLD">Old</option>
        </Select>
      </div>

      {isLoading && <LoadingState label="Loading reservations..." rows={5} columns={6} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState title="No reservations found" description="Try adjusting your search or filters." action={newReservationAction} />
      )}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>No.</TableHeaderCell>
              <TableHeaderCell>Patient</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Doctor</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Patient Type</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} doctorName={doctorName(reservation.doctorId)} />
            ))}
          </TableBody>
        </Table>
      )}
      {data && <Pagination meta={data.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  );
}
