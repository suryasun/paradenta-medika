import { QueueEntry } from "../types/queue.types";

// docs/02-design/design-system.md §8.2 (verified against shipped code).
// Moved out of QueueListView.tsx (where it previously lived, unconsumed
// by anything but that file's own filter dropdown) so QueueCard can also
// import it to actually render a status Badge -- the gap design-system.md
// §8.2 flagged as this module's top-priority fix: this tone map existed
// but nothing ever rendered it as a Badge, only as an unlabeled border
// accent color.
export const QUEUE_STATUS_TONE: Record<QueueEntry["status"], "neutral" | "success" | "warning" | "error" | "info"> = {
  WAITING: "info",
  CALLED: "warning",
  IN_SERVICE: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "error",
  SKIPPED: "neutral",
};

// docs/02-design/pages/queue.md §8 + design-system.md §11.2: the board's
// drag-and-drop mirrors exactly the forward transitions the existing
// Call/Start/Complete buttons already perform -- nothing reachable by
// drag that isn't already reachable by a button, and no backward/skip-
// ahead transition is offered (matching SAD Rule 5 "Completed can't
// return to Waiting" and Rule 9 "IN_SERVICE only reachable after CALLED").
const VALID_DRAG_TRANSITIONS: Partial<Record<QueueEntry["status"], QueueEntry["status"]>> = {
  WAITING: "CALLED",
  CALLED: "IN_SERVICE",
  IN_SERVICE: "COMPLETED",
};

export function isValidDragTransition(from: QueueEntry["status"], to: QueueEntry["status"]): boolean {
  return VALID_DRAG_TRANSITIONS[from] === to;
}
