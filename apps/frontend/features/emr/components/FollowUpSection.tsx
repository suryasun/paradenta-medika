"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { Reservation } from "@/features/reservation/types/reservation.types";
import { useCreateFollowUp, useFollowUps } from "../hooks/useReferralAndFollowUp";
import { FOLLOW_UP_PRIORITIES, FollowUpPriority } from "../types/emr.types";

const PRIORITY_TONE: Record<FollowUpPriority, "info" | "warning" | "error"> = {
  LOW: "info",
  MEDIUM: "warning",
  HIGH: "error",
};

const RESERVATION_TYPES: Reservation["reservationType"][] = ["FOLLOW_UP", "APPOINTMENT", "CONSULTATION"];
const SOURCES: Reservation["reservationSource"][] = ["PHONE", "WHATSAPP", "WEBSITE", "MOBILE_APP"];

// docs/06-tasks/task-090.md: "an 'auto-book reservation' toggle." Reminder
// delivery is explicitly out of scope (Section 26: "Reminder dikirim
// melalui Notification Module (Future)") -- not built here.
export function FollowUpSection({ visitId, readOnly }: { visitId: string; readOnly: boolean }) {
  const { data: followUps, isLoading, isError, error, refetch } = useFollowUps(visitId);
  const { data: doctorsData } = useDoctors();
  const [followUpDate, setFollowUpDate] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<FollowUpPriority>("MEDIUM");
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [reservationType, setReservationType] = useState<Reservation["reservationType"]>("FOLLOW_UP");
  const [source, setSource] = useState<Reservation["reservationSource"]>("PHONE");
  const createFollowUp = useCreateFollowUp(visitId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!followUpDate) return;
    createFollowUp.mutate(
      {
        followUpDate,
        note: note || undefined,
        priority,
        autoSchedule,
        doctorId: autoSchedule ? doctorId : undefined,
        startTime: autoSchedule ? startTime : undefined,
        reservationType: autoSchedule ? reservationType : undefined,
        source: autoSchedule ? source : undefined,
      },
      {
        onSuccess: () => {
          setFollowUpDate("");
          setNote("");
          setAutoSchedule(false);
          setDoctorId("");
          setStartTime("");
        },
      },
    );
  }

  if (isLoading) return <LoadingState label="Loading follow ups..." rows={3} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!followUps || followUps.length === 0 ? (
        <EmptyState
          title="No follow ups scheduled yet"
          description={!readOnly ? "Use the form below to schedule the first one." : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Note</TableHeaderCell>
              <TableHeaderCell>Reservation</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {followUps.map((followUp) => (
              <TableRow key={followUp.id}>
                <TableCell>{followUp.followUpDate}</TableCell>
                <TableCell>
                  <Badge tone={PRIORITY_TONE[followUp.priority]}>{followUp.priority}</Badge>
                </TableCell>
                <TableCell>{followUp.note ?? "-"}</TableCell>
                <TableCell>{followUp.reservationId ? <Badge tone="success">Scheduled</Badge> : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.followup.create">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Input id="followUpDate" label="Follow Up Date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} required />
              <Select id="followUpPriority" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as FollowUpPriority)}>
                {FOLLOW_UP_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <label className="flex items-center gap-2 pb-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={autoSchedule} onChange={(e) => setAutoSchedule(e.target.checked)} />
                Auto-book reservation
              </label>
            </div>
            <Textarea id="followUpNote" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

            {autoSchedule && (
              <div className="flex flex-wrap items-end gap-3 rounded-md bg-slate-50 p-3">
                <Select id="followUpDoctorId" label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                  <option value="">Select a doctor</option>
                  {doctorsData?.items.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName}
                    </option>
                  ))}
                </Select>
                <Input id="followUpStartTime" label="Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <Select
                  id="followUpReservationType"
                  label="Reservation Type"
                  value={reservationType}
                  onChange={(e) => setReservationType(e.target.value as Reservation["reservationType"])}
                >
                  {RESERVATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                <Select id="followUpSource" label="Source" value={source} onChange={(e) => setSource(e.target.value as Reservation["reservationSource"])}>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {createFollowUp.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(createFollowUp.error)}
              </p>
            )}
            <Button
              type="submit"
              isLoading={createFollowUp.isPending}
              disabled={!followUpDate || (autoSchedule && (!doctorId || !startTime))}
              className="self-start"
            >
              <CalendarPlus size={14} strokeWidth={1.75} aria-hidden="true" />
              Save Follow Up
            </Button>
          </form>
        </PermissionGuard>
      )}
    </div>
  );
}
