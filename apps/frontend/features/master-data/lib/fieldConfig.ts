export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "boolean" | "date" | "select";
  required?: boolean;
  /** Field is only shown/sent on create, never on edit (e.g. immutable codes). */
  createOnly?: boolean;
  options?: SelectOption[];
}

export type EntityFormValues = Record<string, string | number | boolean | undefined>;
