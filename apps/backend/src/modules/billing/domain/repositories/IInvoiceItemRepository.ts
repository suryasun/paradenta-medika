import { InvoiceItem } from '@prisma/client';

export interface CreateInvoiceItemInput {
  invoiceId: string;
  referenceType: string;
  /** docs/06-tasks/task-323.md: nullable -- a ManualCharge item has no catalog entity to reference. */
  referenceId?: string;
  /** docs/06-tasks/task-321.md: precise correlation back to the originating VisitTreatment row. */
  visitTreatmentId?: string;
  /** docs/06-tasks/task-323.md: mandatory for ManualCharge items. */
  reason?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

/** docs/06-tasks/task-321.md: Edit Treatment sync -- item identity (referenceId/visitTreatmentId) never changes, only these fields. */
export interface UpdateInvoiceItemInput {
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  updatedBy: string;
}

export interface IInvoiceItemRepository {
  createMany(inputs: CreateInvoiceItemInput[]): Promise<InvoiceItem[]>;
  findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]>;
  /** docs/06-tasks/task-321.md: locates the item an Edit/Remove Treatment sync should act on. */
  findByVisitTreatmentId(visitTreatmentId: string): Promise<InvoiceItem | null>;
  update(id: string, input: UpdateInvoiceItemInput): Promise<InvoiceItem>;
  /** docs/06-tasks/task-321.md: a removed InvoiceItem on a not-yet-paid Invoice is deleted outright (unlike
   * VisitTreatment's soft delete) -- the Invoice itself isn't yet a finalized financial record. */
  deleteById(id: string): Promise<void>;
}
