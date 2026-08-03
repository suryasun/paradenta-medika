import { Expense } from '@prisma/client';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';

export function toExpenseResponseDto(expense: Expense): ExpenseResponseDto {
  return {
    id: expense.id,
    expenseNo: expense.expenseNo,
    branchId: expense.branchId,
    expenseDate: expense.expenseDate.toISOString(),
    category: expense.category,
    expenseAccountId: expense.expenseAccountId,
    amount: Number(expense.amount),
    approvedAmount: expense.approvedAmount === null ? null : Number(expense.approvedAmount),
    paidAmount: expense.paidAmount === null ? null : Number(expense.paidAmount),
    payeeName: expense.payeeName,
    description: expense.description,
    evidenceUrl: expense.evidenceUrl,
    status: expense.status,
    submittedAt: expense.submittedAt ? expense.submittedAt.toISOString() : null,
    approvedBy: expense.approvedBy,
    approvedAt: expense.approvedAt ? expense.approvedAt.toISOString() : null,
    rejectedBy: expense.rejectedBy,
    rejectedAt: expense.rejectedAt ? expense.rejectedAt.toISOString() : null,
    rejectionReason: expense.rejectionReason,
    paidBy: expense.paidBy,
    paidAt: expense.paidAt ? expense.paidAt.toISOString() : null,
    paymentJournalId: expense.paymentJournalId,
    createdAt: expense.createdAt.toISOString(),
    createdBy: expense.createdBy,
  };
}
