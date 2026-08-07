import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { GenerateInvoiceRequestDto } from '../../application/dtos/GenerateInvoiceRequestDto';
import { ListInvoiceQueryDto } from '../../application/dtos/ListInvoiceQueryDto';
import { CreatePaymentRequestDto } from '../../application/dtos/CreatePaymentRequestDto';
import { ApplyDiscountRequestDto } from '../../application/dtos/ApplyDiscountRequestDto';
import { AddManualChargeRequestDto } from '../../application/dtos/AddManualChargeRequestDto';
import { CancelInvoiceRequestDto } from '../../application/dtos/CancelInvoiceRequestDto';
import { VoidInvoiceRequestDto } from '../../application/dtos/VoidInvoiceRequestDto';
import { RefundPaymentRequestDto } from '../../application/dtos/RefundPaymentRequestDto';
import { InvoiceNumberGenerator } from '../../application/services/InvoiceNumberGenerator';
import { GenerateInvoiceUseCase } from '../../application/use-cases/GenerateInvoiceUseCase';
import { ListInvoicesUseCase } from '../../application/use-cases/ListInvoicesUseCase';
import { GetInvoiceDetailUseCase } from '../../application/use-cases/GetInvoiceDetailUseCase';
import { CloseInvoiceUseCase } from '../../application/use-cases/CloseInvoiceUseCase';
import { CreatePaymentUseCase } from '../../application/use-cases/CreatePaymentUseCase';
import { RefundPaymentUseCase } from '../../application/use-cases/RefundPaymentUseCase';
import { ApplyDiscountUseCase } from '../../application/use-cases/ApplyDiscountUseCase';
import { RemoveDiscountUseCase } from '../../application/use-cases/RemoveDiscountUseCase';
import { AddManualChargeUseCase } from '../../application/use-cases/AddManualChargeUseCase';
import { CancelInvoiceUseCase } from '../../application/use-cases/CancelInvoiceUseCase';
import { VoidInvoiceUseCase } from '../../application/use-cases/VoidInvoiceUseCase';
import { SyncTreatmentToInvoiceUseCase } from '../../application/use-cases/SyncTreatmentToInvoiceUseCase';
import { SyncTreatmentUpdateToInvoiceUseCase } from '../../application/use-cases/SyncTreatmentUpdateToInvoiceUseCase';
import { SyncTreatmentRemovalToInvoiceUseCase } from '../../application/use-cases/SyncTreatmentRemovalToInvoiceUseCase';
import { InvoiceRepository } from '../../infrastructure/repositories/InvoiceRepository';
import { InvoiceItemRepository } from '../../infrastructure/repositories/InvoiceItemRepository';
import { PaymentRepository } from '../../infrastructure/repositories/PaymentRepository';
import { RefundRepository } from '../../infrastructure/repositories/RefundRepository';
import { InvoiceController } from '../controllers/InvoiceController';
import { PaymentController } from '../controllers/PaymentController';
import { VisitRepository } from '../../../emr/infrastructure/repositories/VisitRepository';
import { VisitTreatmentRepository } from '../../../emr/infrastructure/repositories/VisitTreatmentRepository';
import { TreatmentRepository } from '../../../master-data/infrastructure/repositories/TreatmentRepository';
import { PaymentMethodRepository } from '../../../master-data/infrastructure/repositories/PaymentMethodRepository';
import { InsuranceProviderRepository } from '../../../master-data/infrastructure/repositories/InsuranceProviderRepository';
import {
  EMR_FINISHED_EVENT,
  EmrFinishedPayload,
  TREATMENT_RECORDED_EVENT,
  TreatmentRecordedPayload,
  TREATMENT_UPDATED_EVENT,
  TreatmentUpdatedPayload,
  TREATMENT_REMOVED_EVENT,
  TreatmentRemovedPayload,
} from '../../../emr/domain/events/EmrEvents';
import { BranchIdExtractor } from '../../../system/infrastructure/middlewares/branchScopeGuard';

/**
 * docs/06-tasks/task-054.md..task-058.md, task-322.md..task-326.md
 * composition root. Base path `/api/v1/billing/...` and permission codes
 * (`billing.invoice.create`, `billing.invoice.read`, `billing.invoice.close`,
 * `billing.payment.create`) are the literal codes named in each task's
 * Security Impact section.
 *
 * Subscribes to EMRFinished (published by CloseVisitUseCase, task-052) to
 * auto-generate the Invoice, per task-054's "triggered by the EMRFinished
 * event" requirement -- mirrors Queue's subscription to PatientCheckedIn
 * (task-035/037). Unlike that handler, this one is wrapped in try/catch:
 * Billing is downstream of EMR, so a Billing-side failure (e.g. a
 * still-pending double invoice race) must never propagate back through the
 * shared event bus and fail the Visit-closing transaction that triggered it.
 */
export function buildBillingModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
  branchScopeGuard: (getTargetBranchId: BranchIdExtractor) => RequestHandler,
): Router {
  const invoiceRepository = new InvoiceRepository();
  const invoiceItemRepository = new InvoiceItemRepository();
  const paymentRepository = new PaymentRepository();
  const refundRepository = new RefundRepository();
  const visitRepository = new VisitRepository();
  const visitTreatmentRepository = new VisitTreatmentRepository();
  const treatmentRepository = new TreatmentRepository();
  const paymentMethodRepository = new PaymentMethodRepository();
  const insuranceProviderRepository = new InsuranceProviderRepository();
  const invoiceNumberGenerator = new InvoiceNumberGenerator(invoiceRepository);

  const generateInvoiceUseCase = new GenerateInvoiceUseCase(
    visitRepository,
    visitTreatmentRepository,
    treatmentRepository,
    invoiceRepository,
    invoiceItemRepository,
    invoiceNumberGenerator,
    auditService,
  );

  eventBus.subscribe<EmrFinishedPayload>(EMR_FINISHED_EVENT, async (payload) => {
    try {
      await generateInvoiceUseCase.execute({ visitId: payload.visitId, actorUserId: 'system:emr-finished' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to auto-generate Invoice for EMRFinished visit', payload.visitId, error);
    }
  });

  // docs/06-tasks/task-320.md: keeps an already-generated Invoice in sync
  // when a new Treatment is recorded afterward (task-316/task-317 made this
  // possible while the Invoice isn't yet Paid/Closed). Same try/catch
  // discipline as EMRFinished above -- a Billing-side failure here must
  // never propagate back and fail the Treatment-recording transaction that
  // triggered it.
  const syncTreatmentToInvoiceUseCase = new SyncTreatmentToInvoiceUseCase(invoiceRepository, invoiceItemRepository, auditService);
  eventBus.subscribe<TreatmentRecordedPayload>(TREATMENT_RECORDED_EVENT, async (payload) => {
    try {
      await syncTreatmentToInvoiceUseCase.execute({
        visitId: payload.visitId,
        visitTreatmentId: payload.visitTreatmentId,
        treatmentId: payload.treatmentId,
        treatmentName: payload.treatmentName,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        subtotal: payload.subtotal,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to sync recorded Treatment into Invoice', payload.visitId, error);
    }
  });

  // docs/06-tasks/task-321.md: Edit Treatment sync -- same no-op/try-catch discipline as above.
  const syncTreatmentUpdateToInvoiceUseCase = new SyncTreatmentUpdateToInvoiceUseCase(invoiceRepository, invoiceItemRepository, auditService);
  eventBus.subscribe<TreatmentUpdatedPayload>(TREATMENT_UPDATED_EVENT, async (payload) => {
    try {
      await syncTreatmentUpdateToInvoiceUseCase.execute({
        visitId: payload.visitId,
        visitTreatmentId: payload.visitTreatmentId,
        treatmentName: payload.treatmentName,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        subtotal: payload.subtotal,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to sync updated Treatment into Invoice', payload.visitId, error);
    }
  });

  // docs/06-tasks/task-321.md: Remove Treatment sync -- same no-op/try-catch discipline as above.
  const syncTreatmentRemovalToInvoiceUseCase = new SyncTreatmentRemovalToInvoiceUseCase(invoiceRepository, invoiceItemRepository, auditService);
  eventBus.subscribe<TreatmentRemovedPayload>(TREATMENT_REMOVED_EVENT, async (payload) => {
    try {
      await syncTreatmentRemovalToInvoiceUseCase.execute({
        visitId: payload.visitId,
        visitTreatmentId: payload.visitTreatmentId,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to sync removed Treatment into Invoice', payload.visitId, error);
    }
  });

  const invoiceController = new InvoiceController(
    generateInvoiceUseCase,
    new ListInvoicesUseCase(invoiceRepository),
    new GetInvoiceDetailUseCase(invoiceRepository, invoiceItemRepository, paymentRepository, refundRepository),
    new CloseInvoiceUseCase(invoiceRepository, auditService),
    new ApplyDiscountUseCase(invoiceRepository, auditService),
    new RemoveDiscountUseCase(invoiceRepository, auditService),
    new AddManualChargeUseCase(invoiceRepository, invoiceItemRepository, auditService),
    new CancelInvoiceUseCase(invoiceRepository, auditService),
    new VoidInvoiceUseCase(invoiceRepository, auditService),
  );

  const paymentController = new PaymentController(
    new CreatePaymentUseCase(invoiceRepository, paymentRepository, paymentMethodRepository, auditService, eventBus, insuranceProviderRepository),
    new RefundPaymentUseCase(invoiceRepository, paymentRepository, refundRepository, auditService, eventBus),
  );

  const router = Router();
  router.use(authenticate);

  // docs/06-tasks/task-216.md retrofit demonstration: rejects an
  // out-of-scope branchId query filter for non-cross-branch requesters.
  router.get(
    '/billing/invoices',
    requirePermission('billing.invoice.read'),
    validateQuery(ListInvoiceQueryDto),
    branchScopeGuard((req) => (req.query as unknown as ListInvoiceQueryDto).branchId),
    invoiceController.list,
  );
  router.post(
    '/billing/invoices',
    requirePermission('billing.invoice.create'),
    validateBody(GenerateInvoiceRequestDto),
    invoiceController.generate,
  );
  router.get('/billing/invoices/:id', requirePermission('billing.invoice.read'), invoiceController.detail);
  router.post('/billing/invoices/:id/close', requirePermission('billing.invoice.close'), invoiceController.close);

  // docs/06-tasks/task-322.md
  router.post(
    '/billing/invoices/:id/discount',
    requirePermission('billing.invoice.discount.apply'),
    validateBody(ApplyDiscountRequestDto),
    invoiceController.applyDiscount,
  );
  router.delete('/billing/invoices/:id/discount', requirePermission('billing.invoice.discount.apply'), invoiceController.removeDiscount);

  // docs/06-tasks/task-323.md
  router.post(
    '/billing/invoices/:id/items',
    requirePermission('billing.invoice.manual-charge.add'),
    validateBody(AddManualChargeRequestDto),
    invoiceController.addManualCharge,
  );

  // docs/06-tasks/task-324.md
  router.post(
    '/billing/invoices/:id/cancel',
    requirePermission('billing.invoice.cancel'),
    validateBody(CancelInvoiceRequestDto),
    invoiceController.cancel,
  );

  // docs/06-tasks/task-325.md
  router.post(
    '/billing/invoices/:id/void',
    requirePermission('billing.invoice.void'),
    validateBody(VoidInvoiceRequestDto),
    invoiceController.void,
  );

  router.post(
    '/billing/payments',
    requirePermission('billing.payment.create'),
    validateBody(CreatePaymentRequestDto),
    paymentController.create,
  );

  // docs/06-tasks/task-326.md
  router.post(
    '/billing/payments/:id/refund',
    requirePermission('billing.payment.refund'),
    validateBody(RefundPaymentRequestDto),
    paymentController.refund,
  );

  return router;
}
