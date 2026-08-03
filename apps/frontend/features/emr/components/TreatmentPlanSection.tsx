"use client";

import { FormEvent, useState } from "react";
import { CalendarClock, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useTreatments } from "@/features/master-data/hooks/useTreatments";
import { useDoctors } from "@/features/master-data/hooks/useDoctors";
import { formatCurrency } from "@/utils/currency";
import { Reservation } from "@/features/reservation/types/reservation.types";
import { useConvertTreatmentPlanToReservation, useCreateTreatmentPlan, useTreatmentPlan } from "../hooks/useTreatmentPlan";
import { TREATMENT_PLAN_PRIORITIES, TreatmentPlanItem, TreatmentPlanItemEntryInput, TreatmentPlanPriority } from "../types/emr.types";

const PRIORITY_TONE: Record<TreatmentPlanPriority, "info" | "warning" | "error"> = {
  LOW: "info",
  MEDIUM: "warning",
  HIGH: "error",
};

const RESERVATION_TYPES: Reservation["reservationType"][] = ["APPOINTMENT", "FOLLOW_UP", "EMERGENCY", "CONSULTATION"];
const SOURCES: Reservation["reservationSource"][] = ["PHONE", "WHATSAPP", "WEBSITE", "MOBILE_APP"];

// docs/06-tasks/task-063.md: planned future treatment(s), distinct from the
// Treatment tab's "performed now" entries -- staged multi-add like
// DiagnosisSection, since "one or more" items are submitted together.
export function TreatmentPlanSection({ visitId, readOnly }: { visitId: string; readOnly: boolean }) {
  const { data: items, isLoading, isError, error, refetch } = useTreatmentPlan(visitId);
  const { data: treatmentsData } = useTreatments();
  const [pending, setPending] = useState<TreatmentPlanItemEntryInput[]>([]);
  const [treatmentId, setTreatmentId] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [priority, setPriority] = useState<TreatmentPlanPriority>("MEDIUM");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedDurationMinute, setEstimatedDurationMinute] = useState("");
  const [scheduleItem, setScheduleItem] = useState<TreatmentPlanItem | null>(null);
  const createTreatmentPlan = useCreateTreatmentPlan(visitId);

  const treatmentName = (id: string) => treatmentsData?.items.find((t) => t.id === id)?.treatmentName ?? id;

  function addPending() {
    if (!treatmentId || !estimatedCost) return;
    setPending((prev) => [
      ...prev,
      {
        treatmentId,
        toothNumber: toothNumber ? Number(toothNumber) : undefined,
        priority,
        estimatedCost: Number(estimatedCost),
        estimatedDurationMinute: estimatedDurationMinute ? Number(estimatedDurationMinute) : undefined,
      },
    ]);
    setTreatmentId("");
    setToothNumber("");
    setEstimatedCost("");
    setEstimatedDurationMinute("");
  }

  function submitPending() {
    createTreatmentPlan.mutate(pending, { onSuccess: () => setPending([]) });
  }

  if (isLoading) return <LoadingState label="Loading treatment plan..." rows={3} columns={6} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!items || items.length === 0 ? (
        <EmptyState
          title="No treatment plan items yet"
          description={!readOnly ? "Use the form below to add the first planned treatment." : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Treatment</TableHeaderCell>
              <TableHeaderCell>Tooth</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Estimated Cost</TableHeaderCell>
              <TableHeaderCell>Estimated Duration</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{treatmentName(item.treatmentId)}</TableCell>
                <TableCell>{item.toothNumber ?? "-"}</TableCell>
                <TableCell>
                  <Badge tone={PRIORITY_TONE[item.priority]}>{item.priority}</Badge>
                </TableCell>
                <TableCell className="font-tabular">{formatCurrency(item.estimatedCost)}</TableCell>
                <TableCell className="font-tabular">{item.estimatedDurationMinute ? `${item.estimatedDurationMinute} min` : "-"}</TableCell>
                <TableCell>
                  <PermissionGuard permission="reservation.create">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      onClick={() => setScheduleItem(item)}
                    >
                      <CalendarClock size={13} strokeWidth={1.75} aria-hidden="true" />
                      Schedule This
                    </button>
                  </PermissionGuard>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.treatment-plan.create">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Select id="treatmentId" label="Treatment" value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} className="min-w-64">
                <option value="">Select a treatment</option>
                {treatmentsData?.items.map((treatment) => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.treatmentName}
                  </option>
                ))}
              </Select>
              <Input id="toothNumber" label="Tooth (FDI)" value={toothNumber} onChange={(e) => setToothNumber(e.target.value)} className="min-w-24" />
              <Select id="priority" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as TreatmentPlanPriority)}>
                {TREATMENT_PLAN_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <Input
                id="estimatedCost"
                label="Estimated Cost"
                type="number"
                min={0}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="min-w-32"
              />
              <Input
                id="estimatedDurationMinute"
                label="Estimated Duration (min)"
                type="number"
                min={0}
                value={estimatedDurationMinute}
                onChange={(e) => setEstimatedDurationMinute(e.target.value)}
                className="min-w-32"
              />
              <Button type="button" variant="secondary" onClick={addPending} disabled={!treatmentId || !estimatedCost}>
                <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                Add
              </Button>
            </div>

            {pending.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm">
                {pending.map((entry, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Badge tone={PRIORITY_TONE[entry.priority ?? "MEDIUM"]}>{entry.priority ?? "MEDIUM"}</Badge>
                    {treatmentName(entry.treatmentId)} — {formatCurrency(entry.estimatedCost)}
                  </li>
                ))}
              </ul>
            )}

            {createTreatmentPlan.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(createTreatmentPlan.error)}
              </p>
            )}
            <Button
              type="button"
              isLoading={createTreatmentPlan.isPending}
              disabled={pending.length === 0}
              onClick={submitPending}
              className="self-start"
            >
              <Save size={14} strokeWidth={1.75} aria-hidden="true" />
              Save Treatment Plan
            </Button>
          </div>
        </PermissionGuard>
      )}

      {scheduleItem && <ScheduleReservationModal visitId={visitId} item={scheduleItem} onClose={() => setScheduleItem(null)} />}
    </div>
  );
}

function ScheduleReservationModal({ visitId, item, onClose }: { visitId: string; item: TreatmentPlanItem; onClose: () => void }) {
  const { data: doctorsData } = useDoctors();
  const [doctorId, setDoctorId] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [reservationType, setReservationType] = useState<Reservation["reservationType"]>("APPOINTMENT");
  const [source, setSource] = useState<Reservation["reservationSource"]>("PHONE");
  const convert = useConvertTreatmentPlanToReservation(visitId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!doctorId || !reservationDate || !startTime) return;
    convert.mutate(
      { itemId: item.id, payload: { doctorId, reservationDate, startTime, reservationType, source } },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="Schedule This Treatment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select id="scheduleDoctorId" label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
          <option value="">Select a doctor</option>
          {doctorsData?.items.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.fullName}
            </option>
          ))}
        </Select>
        <Input id="scheduleDate" label="Date" type="date" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)} required />
        <Input id="scheduleTime" label="Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        <Select
          id="scheduleReservationType"
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
        <Select id="scheduleSource" label="Source" value={source} onChange={(e) => setSource(e.target.value as Reservation["reservationSource"])}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        {convert.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(convert.error)}
          </p>
        )}
        <Button type="submit" isLoading={convert.isPending} disabled={!doctorId || !reservationDate || !startTime}>
          Create Reservation
        </Button>
      </form>
    </Modal>
  );
}
