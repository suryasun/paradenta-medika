// Mirrors apps/backend/src/modules/queue/application/dtos/QueueResponseDto.ts
export interface QueueEntry {
  id: string;
  queueNumber: string;
  branchId: string;
  patientId: string;
  doctorId: string;
  reservationId: string | null;
  queueDate: string;
  queueType: "WALK_IN" | "RESERVATION" | "EMERGENCY";
  priority: "NORMAL" | "ELDERLY" | "PREGNANT" | "EMERGENCY" | "VIP";
  status: "WAITING" | "CALLED" | "IN_SERVICE" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "SKIPPED";
  checkedInAt: string;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
}

export interface QueueDashboard {
  queueSummary: {
    waiting: number;
    called: number;
    inService: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  doctorSummary: Array<{ doctorId: string; queueCount: number }>;
  branchSummary: {
    totalPatientToday: number;
    averageWaitingTimeMinutes: number | null;
    averageServiceTimeMinutes: number | null;
    completionRate: number;
  };
}

export interface CreateQueueInput {
  patientId: string;
  doctorId: string;
  reservationId?: string;
  isEmergency?: boolean;
}

export interface ListQueueParams {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  branchId?: string;
  visitDate?: string;
}
