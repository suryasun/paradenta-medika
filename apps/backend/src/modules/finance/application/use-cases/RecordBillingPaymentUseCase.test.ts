import { RecordBillingPaymentUseCase } from './RecordBillingPaymentUseCase';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import {
  FakeAccountRepository,
  FakeCashAccountRepository,
  FakeFinanceAccountMappingRepository,
  FakeJournalRepository,
} from '../../../../../tests/fakes/financeFakes';
import { FakeInvoiceRepository, FakePaymentRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { AccountMappingMissingException, JournalDuplicatePostingException } from '../../domain/exceptions/FinanceExceptions';
import { InvoiceNotFoundException, PaymentNotFoundException } from '../../../billing/domain/exceptions/BillingExceptions';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const paymentRepository = new FakePaymentRepository();
  const accountMappingRepository = new FakeFinanceAccountMappingRepository();
  const cashAccountRepository = new FakeCashAccountRepository();
  const accountRepository = new FakeAccountRepository();
  const journalRepository = new FakeJournalRepository();
  const auditService = new FakeAuditService();

  const useCase = new RecordBillingPaymentUseCase(
    invoiceRepository,
    paymentRepository,
    accountMappingRepository,
    cashAccountRepository,
    accountRepository,
    journalRepository,
    new JournalNumberGenerator(journalRepository),
    auditService,
  );

  return {
    invoiceRepository,
    paymentRepository,
    accountMappingRepository,
    cashAccountRepository,
    accountRepository,
    journalRepository,
    useCase,
  };
}

async function seedMapping(sut: ReturnType<typeof buildSut>, branchId: string, paymentMethodId: string) {
  const ledgerAccount = await sut.accountRepository.create({
    code: '1-1000',
    name: 'Cash',
    accountType: 'ASSET',
    normalBalance: 'DEBIT',
    isPostable: true,
    createdBy: 'u1',
  });
  const revenueAccount = await sut.accountRepository.create({
    code: '4-1000',
    name: 'Revenue',
    accountType: 'REVENUE',
    normalBalance: 'CREDIT',
    isPostable: true,
    createdBy: 'u1',
  });
  const cashAccount = await sut.cashAccountRepository.create({
    branchId,
    code: 'CA-1',
    name: 'Main Cash',
    accountType: 'CASH',
    ledgerAccountId: ledgerAccount.id,
    createdBy: 'u1',
  });
  const mapping = await sut.accountMappingRepository.create({
    branchId,
    paymentMethodId,
    cashAccountId: cashAccount.id,
    revenueAccountId: revenueAccount.id,
    createdBy: 'u1',
  });
  return { ledgerAccount, revenueAccount, cashAccount, mapping };
}

describe('RecordBillingPaymentUseCase (task-162, UC-FIN-001)', () => {
  it('posts a balanced system journal and updates the cash account balance for a completed payment', async () => {
    const sut = buildSut();
    const branchId = 'branch-1';
    const paymentMethodId = 'pm-1';
    const { ledgerAccount, revenueAccount, cashAccount } = await seedMapping(sut, branchId, paymentMethodId);

    const invoice = await sut.invoiceRepository.create({
      invoiceNo: 'INV-0001',
      visitId: 'visit-1',
      patientId: 'patient-1',
      branchId,
      subtotal: 500000,
      discount: 0,
      tax: 0,
      grandTotal: 500000,
      createdBy: 'u1',
    });
    const payment = await sut.paymentRepository.create({
      invoiceId: invoice.id,
      paymentMethodId,
      amount: 500000,
      receivedBy: 'u1',
      createdBy: 'u1',
    });

    await sut.useCase.execute({ invoiceId: invoice.id, paymentIds: [payment.id], actorUserId: 'u1' });

    const journalRef = await sut.journalRepository.findByReference('BILLING_PAYMENT', payment.id, 'BILLING_PAYMENT');
    expect(journalRef).not.toBeNull();
    const journal = await sut.journalRepository.findById(journalRef!.id);
    expect(journal!.status).toBe('POSTED');
    expect(journal!.lines).toHaveLength(2);
    expect(journal!.lines.find((l) => l.accountId === ledgerAccount.id)?.debit).toBe(500000);
    expect(journal!.lines.find((l) => l.accountId === revenueAccount.id)?.credit).toBe(500000);

    const updatedCashAccount = await sut.cashAccountRepository.findById(cashAccount.id);
    expect(Number(updatedCashAccount!.currentBalance)).toBe(500000);
  });

  it('is idempotent: redelivering an already-posted payment throws FIN_DUPLICATE_POSTING without posting twice', async () => {
    const sut = buildSut();
    const branchId = 'branch-1';
    const paymentMethodId = 'pm-1';
    await seedMapping(sut, branchId, paymentMethodId);

    const invoice = await sut.invoiceRepository.create({
      invoiceNo: 'INV-0001',
      visitId: 'visit-1',
      patientId: 'patient-1',
      branchId,
      subtotal: 500000,
      discount: 0,
      tax: 0,
      grandTotal: 500000,
      createdBy: 'u1',
    });
    const payment = await sut.paymentRepository.create({
      invoiceId: invoice.id,
      paymentMethodId,
      amount: 500000,
      receivedBy: 'u1',
      createdBy: 'u1',
    });

    await sut.useCase.execute({ invoiceId: invoice.id, paymentIds: [payment.id], actorUserId: 'u1' });

    await expect(
      sut.useCase.execute({ invoiceId: invoice.id, paymentIds: [payment.id], actorUserId: 'u1' }),
    ).rejects.toThrow(JournalDuplicatePostingException);

    const journalsForPayment = [...sut.journalRepository.journals.values()].filter(
      (j) => j.referenceType === 'BILLING_PAYMENT' && j.referenceId === payment.id,
    );
    expect(journalsForPayment).toHaveLength(1);
  });

  it('posts only the not-yet-posted lines when one payment in the batch was already posted (partial redelivery)', async () => {
    const sut = buildSut();
    const branchId = 'branch-1';
    const paymentMethodId = 'pm-1';
    await seedMapping(sut, branchId, paymentMethodId);

    const invoice = await sut.invoiceRepository.create({
      invoiceNo: 'INV-0001',
      visitId: 'visit-1',
      patientId: 'patient-1',
      branchId,
      subtotal: 500000,
      discount: 0,
      tax: 0,
      grandTotal: 500000,
      createdBy: 'u1',
    });
    const paymentA = await sut.paymentRepository.create({
      invoiceId: invoice.id,
      paymentMethodId,
      amount: 300000,
      receivedBy: 'u1',
      createdBy: 'u1',
    });
    const paymentB = await sut.paymentRepository.create({
      invoiceId: invoice.id,
      paymentMethodId,
      amount: 200000,
      receivedBy: 'u1',
      createdBy: 'u1',
    });

    await sut.useCase.execute({ invoiceId: invoice.id, paymentIds: [paymentA.id], actorUserId: 'u1' });
    await sut.useCase.execute({ invoiceId: invoice.id, paymentIds: [paymentA.id, paymentB.id], actorUserId: 'u1' });

    const journalForB = await sut.journalRepository.findByReference('BILLING_PAYMENT', paymentB.id, 'BILLING_PAYMENT');
    expect(journalForB).not.toBeNull();

    const journalsForA = [...sut.journalRepository.journals.values()].filter(
      (j) => j.referenceType === 'BILLING_PAYMENT' && j.referenceId === paymentA.id,
    );
    expect(journalsForA).toHaveLength(1);
  });

  it('throws FIN_ACCOUNT_MAPPING_MISSING when no active mapping exists for the branch/payment method', async () => {
    const sut = buildSut();
    const invoice = await sut.invoiceRepository.create({
      invoiceNo: 'INV-0001',
      visitId: 'visit-1',
      patientId: 'patient-1',
      branchId: 'branch-1',
      subtotal: 500000,
      discount: 0,
      tax: 0,
      grandTotal: 500000,
      createdBy: 'u1',
    });
    const payment = await sut.paymentRepository.create({
      invoiceId: invoice.id,
      paymentMethodId: 'pm-unmapped',
      amount: 500000,
      receivedBy: 'u1',
      createdBy: 'u1',
    });

    await expect(
      sut.useCase.execute({ invoiceId: invoice.id, paymentIds: [payment.id], actorUserId: 'u1' }),
    ).rejects.toThrow(AccountMappingMissingException);
  });

  it('throws InvoiceNotFoundException when the invoice does not exist', async () => {
    const sut = buildSut();
    await expect(
      sut.useCase.execute({ invoiceId: 'missing-invoice', paymentIds: ['payment-1'], actorUserId: 'u1' }),
    ).rejects.toThrow(InvoiceNotFoundException);
  });

  it('throws PaymentNotFoundException when a payment id in the batch does not exist', async () => {
    const sut = buildSut();
    const invoice = await sut.invoiceRepository.create({
      invoiceNo: 'INV-0001',
      visitId: 'visit-1',
      patientId: 'patient-1',
      branchId: 'branch-1',
      subtotal: 500000,
      discount: 0,
      tax: 0,
      grandTotal: 500000,
      createdBy: 'u1',
    });

    await expect(
      sut.useCase.execute({ invoiceId: invoice.id, paymentIds: ['missing-payment'], actorUserId: 'u1' }),
    ).rejects.toThrow(PaymentNotFoundException);
  });
});
