import { render, screen } from "@testing-library/react";
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
    items: [{ id: "it1", referenceType: "Treatment", referenceId: "t1", itemName: "Scaling", quantity: 1, unitPrice: 400000, discount: 0, tax: 0, total: 400000 }],
    payments: [],
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
      permissions: ["billing.payment.create", "billing.invoice.close"],
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
});
