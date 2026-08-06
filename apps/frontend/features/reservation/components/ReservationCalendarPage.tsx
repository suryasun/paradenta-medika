"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { cn } from "@/utils/cn";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { useReservations } from "../hooks/useReservations";
import { Reservation } from "../types/reservation.types";
import { RESERVATION_STATUS_TONE } from "./ReservationListView";
import { ReservationDetailView } from "./ReservationDetailView";

type ViewMode = "day" | "week" | "month" | "agenda";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Monday-start week, matching docs/02-design/pages/reservation.md §8.3's
// reference screenshot layout.
function startOfWeek(date: Date): Date {
  const dow = date.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(date, diff);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

// Calendar-grid start/end: the Monday on/before the 1st, through the Sunday
// on/after the last day -- so the Month grid always renders full weeks.
function monthGridRange(date: Date): { from: Date; to: Date } {
  return { from: startOfWeek(startOfMonth(date)), to: addDays(startOfWeek(endOfMonth(date)), 6) };
}

function groupByDate(reservations: Reservation[]): Map<string, Reservation[]> {
  const groups = new Map<string, Reservation[]>();
  for (const reservation of reservations) {
    const existing = groups.get(reservation.reservationDate) ?? [];
    existing.push(reservation);
    groups.set(reservation.reservationDate, existing);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return groups;
}

function ReservationEntry({
  reservation,
  doctorName,
  onClick,
}: {
  reservation: Reservation;
  doctorName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-0.5 rounded-md border border-border bg-white px-2 py-1.5 text-left text-xs hover:bg-slate-50"
    >
      <span className="font-tabular font-medium text-foreground">{reservation.startTime}</span>
      <span className="text-muted">
        {doctorName} &middot; {reservation.reservationType}
      </span>
      <div className="flex gap-1">
        <Badge tone={RESERVATION_STATUS_TONE[reservation.status]}>{reservation.status}</Badge>
        <Badge tone={reservation.patientType === "NEW" ? "info" : "neutral"}>{reservation.patientType}</Badge>
      </div>
    </button>
  );
}

// docs/06-tasks/task-293.md (Epic RE4, Reservation Module Enhancement
// addendum). No new calendar/charting library -- built entirely from this
// project's existing Table/Badge/Modal/Select primitives, per
// docs/04-ai-contract/10-code-generation-rules.md.
export function ReservationCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(() => toDateOnly(new Date()));
  const [view, setView] = useState<ViewMode>("agenda");
  const [doctorId, setDoctorId] = useState("");
  const [patientType, setPatientType] = useState<"" | "NEW" | "OLD">("");
  const [openReservationId, setOpenReservationId] = useState<string | null>(null);

  const { data: doctorsData } = useDoctors();
  const doctorName = (id: string) => doctorsData?.items.find((d) => d.id === id)?.fullName ?? "—";

  const current = parseDateOnly(selectedDate);
  const range = useMemo(() => {
    if (view === "day") return { from: current, to: current };
    if (view === "week") {
      const from = startOfWeek(current);
      return { from, to: addDays(from, 6) };
    }
    // month + agenda both view the full calendar-grid range around the
    // current month, so switching between them doesn't lose data.
    return monthGridRange(current);
  }, [view, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError, error, refetch } = useReservations({
    dateFrom: toDateOnly(range.from),
    dateTo: toDateOnly(range.to),
    doctorId: doctorId || undefined,
    patientType: patientType || undefined,
    limit: 100,
  });

  const grouped = useMemo(() => groupByDate(data?.items ?? []), [data]);
  const dayList = grouped.get(selectedDate) ?? [];

  function changeView(next: ViewMode) {
    setView(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground">Reservation Calendar</h1>
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(["day", "week", "month", "agenda"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeView(mode)}
              className={cn(
                "rounded px-3 py-1 text-sm capitalize transition-colors",
                view === mode ? "bg-primary text-primary-foreground" : "text-muted hover:bg-slate-50",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          aria-label="Selected date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <Select id="calendarDoctorId" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">All doctors</option>
          {doctorsData?.items.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.fullName}
            </option>
          ))}
        </Select>
        {/* task-290 (Epic RE1) soft dependency: Patient Type filter chip */}
        <Select id="calendarPatientType" value={patientType} onChange={(e) => setPatientType(e.target.value as "" | "NEW" | "OLD")}>
          <option value="">All patients</option>
          <option value="NEW">New</option>
          <option value="OLD">Old</option>
        </Select>
      </div>

      {isLoading && <LoadingState label="Loading calendar..." rows={5} columns={4} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {view === "day" && (
            <div className="flex flex-col gap-2">
              {dayList.length === 0 && <p className="text-sm text-muted">No reservations on {selectedDate}.</p>}
              {dayList.map((reservation) => (
                <ReservationEntry
                  key={reservation.id}
                  reservation={reservation}
                  doctorName={doctorName(reservation.doctorId)}
                  onClick={() => setOpenReservationId(reservation.id)}
                />
              ))}
            </div>
          )}

          {view === "week" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => addDays(range.from, i)).map((date) => {
                const dateStr = toDateOnly(date);
                const entries = grouped.get(dateStr) ?? [];
                return (
                  <div key={dateStr} className="flex flex-col gap-2 rounded-md border border-border p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        changeView("day");
                      }}
                      className="text-left text-xs font-semibold text-foreground hover:underline"
                    >
                      {dateStr}
                    </button>
                    {entries.length === 0 && <span className="text-xs text-muted">—</span>}
                    {entries.map((reservation) => (
                      <ReservationEntry
                        key={reservation.id}
                        reservation={reservation}
                        doctorName={doctorName(reservation.doctorId)}
                        onClick={() => setOpenReservationId(reservation.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {view === "month" && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000) + 1 }, (_, i) => addDays(range.from, i)).map(
                (date) => {
                  const dateStr = toDateOnly(date);
                  const count = grouped.get(dateStr)?.length ?? 0;
                  const inMonth = date.getUTCMonth() === current.getUTCMonth();
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        changeView("day");
                      }}
                      className={cn(
                        "flex h-16 flex-col items-start justify-between rounded-md border border-border p-1.5 text-left text-xs hover:bg-slate-50",
                        !inMonth && "opacity-40",
                      )}
                    >
                      <span className="font-tabular">{date.getUTCDate()}</span>
                      {count > 0 && <Badge tone="info">{count}</Badge>}
                    </button>
                  );
                },
              )}
            </div>
          )}

          {view === "agenda" && (
            <div className="flex flex-col gap-4">
              {[...grouped.entries()].length === 0 && <p className="text-sm text-muted">No reservations in this range.</p>}
              {[...grouped.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateStr, entries]) => (
                  <div key={dateStr}>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">{dateStr}</h3>
                    <div className="flex flex-col gap-2">
                      {entries.map((reservation) => (
                        <ReservationEntry
                          key={reservation.id}
                          reservation={reservation}
                          doctorName={doctorName(reservation.doctorId)}
                          onClick={() => setOpenReservationId(reservation.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {openReservationId && (
        <Modal title="Reservation Detail" onClose={() => setOpenReservationId(null)}>
          <ReservationDetailView reservationId={openReservationId} />
        </Modal>
      )}
    </div>
  );
}
