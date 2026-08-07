import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InvoiceDetailView } from "./InvoiceDetailView";
import { billingService } from "../services/billing.service";
import { paymentMethodService } from "@/features/master-data/services/paymentMethod.service";
import { useAuthStore } from "@/stores/auth.store";
import { InvoiceDetail } from "../types/billing.types";

jest.mock("../services/billing.service");
jest.mock("@/features/master-data/services/paymentMethod.service");
const mockedBillingService = jest.mocked(billingService);
const mockedPaymentMethodService = jest.mocked(paymentMethodService);

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <InvoiceDetailView invoiceId="inv1" />
    </QueryClientProvider>,
  );
}

function buildInvoice(overrides: Partial<InvoiceDetail> = {}): InvoiceDetail {
  return {
    id: "inv1",
    invoiceNo: "INV-20260802-000001",
    visitId: "v1",
    patientId: "p1",
    branchId: "b1",
    invoiceDate: "2026-08-02T09:00:00.000Z",
    subtotal: 400000,
    discount: 0,
    tax: 0,
    grandTotal: 400000,
    paidAmount: 0,
    outstanding: 400000,
    status: "UNPAID",
    discountReason: null,
    discountSource: null,
    discountApprovedBy: null,
    cancelReason: null,
    cancelledBy: null,
    cancelledAt: null,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    items: [{ id: "it1", referenceType: "Treatment", referenceId: "t1", itemName: "Scaling", quantity: 1, unitPrice: 400000, discount: 0, tax: 0, total: 400000, reason: null }],
    payments: [],
    refunds: [],
    ...overrides,
  };
}

describe("InvoiceDetailView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPaymentMethodService.list.mockResolvedValue({
      items: [{ id: "pm1", methodCode: "CASH", methodName: "Cash", isCash: true, isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "cashier", email: "cashier@example.com" },
      role: "CASHIER",
      roles: ["CASHIER"],
      permissions: [
        "billing.payment.create",
        "billing.invoice.close",
        "billing.invoice.discount.apply",
        "billing.invoice.manual-charge.add",
        "billing.invoice.cancel",
        "billing.invoice.void",
        "billing.payment.refund",
      ],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows Record Payment but not Close Invoice for an UNPAID invoice", async () => {
    mockedBillingService.detail.mockResolvedValue(buildInvoice());

    renderView();

    expect(await screen.findByRole("button", { name: "Record Payment" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close Invoice" })).not.toBeInTheDocument();
    expect(screen.getByText("Scaling")).toBeInTheDocument();
  });

  it("shows Close Invoice but not Record Payment for a PAID invoice", async () => {
    mockedBillingService.detail.mockResolvedValue(buildInvoice({ status: "PAID", paidAmount: 400000, outstanding: 0 }));

    renderView();

    expect(await screen.findByRole("button", { name: "Close Invoice" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Payment" })).not.toBeInTheDocument();
  });

  it("opens the payment modal with the outstanding balance pre-filled and a Cash option", async () => {
    const user = userEvent.setup();
    mockedBillingService.detail.mockResolvedValue(buildInvoice());

    renderView();
    await user.click(await screen.findByRole("button", { name: "Record Payment" }));

    expect(screen.getByRole("dialog", { name: "Record Payment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveValue(400000);
    expect(screen.getByText("Cash")).toBeInTheDocument();
  });

  // docs/06-tasks/task-322.md
  it("applies a discount and shows the reason once applied", async () => {
    const user = userEvent.setup();
    mockedBillingService.detail.mockResolvedValue(buildInvoice());
    mockedBillingService.applyDiscount.mockResolvedValue(
      buildInvoice({ discount: 50000, grandTotal: 350000, discountReason: "Loyal patient", discountSource: "MANUAL" }),
    );

    renderView();
    await user.click(await screen.findByRole("button", { name: "Apply Discount" }));
    const dialog = screen.getByRole("dialog", { name: "Apply Discount" });
    await user.type(within(dialog).getByLabelText("Discount Amount"), "50000");
    await user.type(within(dialog).getByLabelText("Reason"), "Loyal patient");
    await user.click(within(dialog).getByRole("button", { name: "Apply Discount" }));

    await waitFor(() =>
      expect(mockedBillingService.applyDiscount).toHaveBeenCalledWith("inv1", { amount: 50000, source: "MANUAL", reason: "Loyal patient" }),
    );
  });

  // docs/06-tasks/task-323.md
  it("adds a manual charge", async () => {
    const user = userEvent.setup();
    mockedBillingService.detail.mockResolvedValue(buildInvoice());
    mockedBillingService.addManualCharge.mockResolvedValue(buildInvoice({ subtotal: 450000, grandTotal: 450000 }));

    renderView();
    await user.click(await screen.findByRole("button", { name: "Add Manual Charge" }));
    await user.type(screen.getByLabelText("Item Name"), "Admin Fee");
    await user.type(screen.getByLabelText("Amount"), "50000");
    await user.type(screen.getByLabelText("Reason"), "Certificate printing");
    await user.click(screen.getByRole("button", { name: "Add Charge" }));

    await waitFor(() =>
      expect(mockedBillingService.addManualCharge).toHaveBeenCalledWith("inv1", { itemName: "Admin Fee", amount: 50000, reason: "Certificate printing" }),
    );
  });

  // docs/06-tasks/task-324.md
  it("shows Cancel Invoice only when UNPAID with zero payment, and cancels with a mandatory reason", async () => {
    const user = userEvent.setup();
    mockedBillingService.detail.mockResolvedValue(buildInvoice());
    mockedBillingService.cancel.mockResolvedValue(buildInvoice({ status: "CANCELLED", cancelReason: "Duplicate" }));

    renderView();
    await user.click(await screen.findByRole("button", { name: "Cancel Invoice" }));
    await user.type(screen.getByLabelText("Reason"), "Duplicate");
    await user.click(screen.getByRole("button", { name: "Confirm Cancel" }));

    await waitFor(() => expect(mockedBillingService.cancel).toHaveBeenCalledWith("inv1", "Duplicate"));
  });

  it("hides Cancel Invoice once a payment exists", async () => {
    mockedBillingService.detail.mockResolvedValue(buildInvoice({ status: "PARTIALLY_PAID", paidAmount: 100000, outstanding: 300000 }));

    renderView();
    await screen.findByRole("button", { name: "Record Payment" });

    expect(screen.queryByRole("button", { name: "Cancel Invoice" })).not.toBeInTheDocument();
  });

  // docs/06-tasks/task-325.md
  it("voids an invoice with a mandatory reason", async () => {
    const user = userEvent.setup();
    mockedBillingService.detail.mockResolvedValue(buildInvoice({ status: "PAID", paidAmount: 400000, outstanding: 0 }));
    mockedBillingService.void.mockResolvedValue(buildInvoice({ status: "VOID", voidReason: "Wrong patient" }));

    renderView();
    await user.click(await screen.findByRole("button", { name: "Void Invoice" }));
    await user.type(screen.getByLabelText("Reason"), "Wrong patient");
    await user.click(screen.getByRole("button", { name: "Confirm Void" }));

    await waitFor(() => expect(mockedBillingService.void).toHaveBeenCalledWith("inv1", "Wrong patient"));
  });

  it("hides Void Invoice once CLOSED", async () => {
    mockedBillingService.detail.mockResolvedValue(buildInvoice({ status: "CLOSED", paidAmount: 400000, outstanding: 0 }));

    renderView();
    await screen.findByText("CLOSED");

    expect(screen.queryByRole("button", { name: "Void Invoice" })).not.toBeInTheDocument();
  });

  // docs/06-tasks/task-326.md
  it("refunds a payment, showing the remaining refundable amount", async () => {
    const user = userEvent.setup();
    mockedBillingService.detail.mockResolvedValue(
      buildInvoice({
        status: "PAID",
        paidAmount: 400000,
        outstanding: 0,
        payments: [
          {
            id: "pay1",
            paymentMethodId: "pm1",
            amount: 400000,
            paymentDate: "2026-08-02T10:00:00.000Z",
            referenceNo: null,
            receivedBy: "u1",
            refundedAmount: 0,
            payerType: "PATIENT",
            insuranceProviderId: null,
            policyNumber: null,
          },
        ],
      }),
    );
    mockedBillingService.refundPayment.mockResolvedValue(buildInvoice({ status: "PARTIALLY_PAID", paidAmount: 300000, outstanding: 100000 }));

    renderView();
    await user.click(await screen.findByRole("button", { name: "Refund" }));
    await user.type(screen.getByLabelText("Refund Amount"), "100000");
    await user.type(screen.getByLabelText("Reason"), "Overcharged");
    await user.click(screen.getByRole("button", { name: "Confirm Refund" }));

    await waitFor(() => expect(mockedBillingService.refundPayment).toHaveBeenCalledWith("pay1", { amount: 100000, reason: "Overcharged" }));
  });
});
