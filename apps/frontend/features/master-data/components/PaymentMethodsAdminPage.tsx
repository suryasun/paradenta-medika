"use client";

import { paymentMethodService } from "../services/paymentMethod.service";
import { PaymentMethod } from "../types/masterData.types";
import { FieldConfig } from "../lib/fieldConfig";
import { AdminEntityListPage } from "./AdminEntityListPage";

const FIELDS: FieldConfig[] = [
  { name: "methodCode", label: "Method Code", type: "text", required: true, createOnly: true },
  { name: "methodName", label: "Method Name", type: "text", required: true },
  { name: "isCash", label: "Is Cash", type: "boolean" },
];

export function PaymentMethodsAdminPage() {
  return (
    <AdminEntityListPage<PaymentMethod>
      title="Payment Methods"
      resourceKey="payment-methods"
      permissionPrefix="masterdata.payment-method"
      columns={[
        { key: "methodCode", label: "Code" },
        { key: "methodName", label: "Name" },
      ]}
      fields={FIELDS}
      service={paymentMethodService}
    />
  );
}
