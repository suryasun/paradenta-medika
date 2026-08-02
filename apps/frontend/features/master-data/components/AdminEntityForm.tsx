"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-client";
import { EntityFormValues, FieldConfig } from "../lib/fieldConfig";

interface AdminEntityFormProps {
  fields: FieldConfig[];
  mode: "create" | "edit";
  initialValues?: EntityFormValues;
  isSubmitting: boolean;
  submitError?: unknown;
  submitLabel: string;
  onSubmit: (values: EntityFormValues) => void;
}

// Config-driven form shared by all six Master Data admin entities (task-
// 021..026): each entity supplies its own FieldConfig[] instead of a
// bespoke form component, since the fields differ but the text/number/
// boolean/select/date rendering pattern does not.
export function AdminEntityForm({ fields, mode, initialValues = {}, isSubmitting, submitError, submitLabel, onSubmit }: AdminEntityFormProps) {
  const [values, setValues] = useState<EntityFormValues>(initialValues);

  function setField(name: string, value: string | number | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  const visibleFields = mode === "edit" ? fields.filter((f) => !f.createOnly) : fields;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {visibleFields.map((field) => {
        const value = values[field.name];
        if (field.type === "boolean") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" checked={Boolean(value)} onChange={(e) => setField(field.name, e.target.checked)} />
              {field.label}
            </label>
          );
        }
        if (field.type === "select") {
          return (
            <Select
              key={field.name}
              id={field.name}
              label={field.label}
              value={(value as string) ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          );
        }
        return (
          <Input
            key={field.name}
            id={field.name}
            label={field.label}
            type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
            value={(value as string | number) ?? ""}
            onChange={(e) => setField(field.name, field.type === "number" ? Number(e.target.value) : e.target.value)}
            required={field.required}
          />
        );
      })}

      {submitError != null && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(submitError)}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
