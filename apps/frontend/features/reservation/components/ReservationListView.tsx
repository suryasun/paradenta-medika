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

function ReservationRow({ reservation }: { reservation: Reservation }) {
  const checkInReservation = useCheckInReservation(reservation.id);
  const canCheckIn = reservation.status === "BOOKED" || reservation.status === "CONFIRMED";

  return (
    <TableRow>
      <TableCell>{reservation.reservationNumber}</TableCell>
      <TableCell>{reservation.reservationDate}</TableCell>
      <TableCell>{reservation.startTime}</TableCell>
      <TableCell>{reservation.reservationType}</TableCell>
      <TableCell>
        <Badge tone={RESERVATION_STATUS_TONE[reservation.status]}>{reservation.status}</Badge>
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

export function ReservationListView() {
  const [filters, setFilters] = useState<ListReservationsParams>({ page: 1, limit: 20 });
  const { data, isLoading, isError, error, refetch } = useReservations(filters);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Reservations</h1>
        <PermissionGuard permission="reservation.create">
          <Link href="/reservations/new">
            <Button>New Reservation</Button>
          </Link>
        </PermissionGuard>
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
          value={filters.dateFrom ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined, page: 1 }))}
        />
      </div>

      {isLoading && <LoadingState label="Loading reservations..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState title="No reservations found" description="Try adjusting your search or filters." />
      )}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>No.</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} />
            ))}
          </TableBody>
        </Table>
      )}
      {data && <Pagination meta={data.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  );
}
