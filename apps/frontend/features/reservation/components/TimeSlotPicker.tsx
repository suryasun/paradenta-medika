"use client";

import { cn } from "@/utils/cn";
import { LoadingState } from "@/components/ui/LoadingState";
import { useDoctorTimeSlots } from "../hooks/useDoctorTimeSlots";

// docs/06-tasks/task-036.md: renders GET /doctors/:id/time-slots as
// clickable AVAILABLE slots (task-036's Slot Status/Calculation, Section
// 16.3/16.4). FULL slots are shown but disabled, not hidden, so staff can
// see the day is fully booked rather than seeing an empty list.
export function TimeSlotPicker({
  doctorId,
  date,
  selectedTime,
  onSelect,
}: {
  doctorId: string;
  date: string;
  selectedTime?: string;
  onSelect: (time: string) => void;
}) {
  const { data: slots, isLoading } = useDoctorTimeSlots(doctorId, date);

  if (!doctorId || !date) {
    return <p className="text-sm text-muted">Select a doctor and date to see available time slots.</p>;
  }
  if (isLoading) return <LoadingState label="Loading time slots..." />;
  if (!slots || slots.length === 0) return <p className="text-sm text-muted">No schedule found for this doctor on this date.</p>;

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          disabled={slot.status === "FULL"}
          onClick={() => onSelect(slot.time)}
          className={cn(
            "rounded-md border px-2 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            slot.time === selectedTime ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white hover:bg-slate-50",
          )}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}
