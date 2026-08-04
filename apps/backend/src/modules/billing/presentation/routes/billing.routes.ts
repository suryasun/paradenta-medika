import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { GenerateInvoiceRequestDto } from '../../application/dtos/GenerateInvoiceRequestDto';
import { ListInvoiceQueryDto } from '../../application/dtos/ListInvoiceQueryDto';
import { CreatePaymentRequestDto } from '../../application/dtos/CreatePaymentRequestDto';
import { InvoiceNumberGenerator } from '../../application/services/InvoiceNumberGenerator';
import { GenerateInvoiceUseCase } from '../../application/use-cases/GenerateInvoiceUseCase';
import { ListInvoicesUseCase } from '../../application/use-cases/ListInvoicesUseCase';
import { GetInvoiceDetailUseCase } from '../../application/use-cases/GetInvoiceDetailUseCase';
import { CloseInvoiceUseCase } from '../../application/use-cases/CloseInvoiceUseCase';
import { CreatePaymentUseCase } from '../../application/use-cases/CreatePaymentUseCase';
import { InvoiceRepository } from '../../infrastructure/repositories/InvoiceRepository';
import { InvoiceItemRepository } from '../../infrastructure/repositories/InvoiceItemRepository';
import { PaymentRepository } from '../../infrastructure/repositories/PaymentRepository';
import { InvoiceController } from '../controllers/InvoiceController';
import { PaymentController } from '../controllers/PaymentController';
import { VisitRepository } from '../../../emr/infrastructure/repositories/VisitRepository';
import { VisitTreatmentRepository } from '../../../emr/infrastructure/repositories/VisitTreatmentRepository';
import { TreatmentRepository } from '../../../master-data/infrastructure/repositories/TreatmentRepository';
import { PaymentMethodRepository } from '../../../master-data/infrastructure/repositories/PaymentMethodRepository';
import { EMR_FINISHED_EVENT, EmrFinishedPayload } from '../../../emr/domain/events/EmrEvents';
import { BranchIdExtractor } from '../../../system/infrastructure/middlewares/branchScopeGuard';

/**
 * docs/06-tasks/task-054.md..task-058.md composition root. Base path
 * `/api/v1/billing/...` and permission codes (`billing.invoice.create`,
 * `billing.invoice.read`, `billing.invoice.close`, `billing.payment.create`)
 * are the literal codes named in each task's Security Impact section.
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
  const visitRepository = new VisitRepository();
  const visitTreatmentRepository = new VisitTreatmentRepository();
  const treatmentRepository = new TreatmentRepository();
  const paymentMethodRepository = new PaymentMethodRepository();
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

  const invoiceController = new InvoiceController(
    generateInvoiceUseCase,
    new ListInvoicesUseCase(invoiceRepository),
    new GetInvoiceDetailUseCase(invoiceRepository, invoiceItemRepository, paymentRepository),
    new CloseInvoiceUseCase(invoiceRepository, auditService),
  );

  const paymentController = new PaymentController(
    new CreatePaymentUseCase(invoiceRepository, paymentRepository, paymentMethodRepository, auditService, eventBus),
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

  router.post(
    '/billing/payments',
    requirePermission('billing.payment.create'),
    validateBody(CreatePaymentRequestDto),
    paymentController.create,
  );

  return router;
}
