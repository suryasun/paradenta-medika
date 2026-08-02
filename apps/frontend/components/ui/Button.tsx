import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

// docs/02-design/Parakita - Design System.dc.html "02 · Components >
// Buttons": Simpan Data (primary filled), Batal (secondary outlined),
// Lihat Detail (tertiary -- 8% primary tint bg, primary-700 text), Void
// Invoice (danger filled), Disabled.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "bg-white text-foreground border border-border hover:bg-slate-50",
  tertiary: "bg-[var(--color-primary-100)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-200)]",
  danger: "bg-error text-white hover:opacity-90",
  ghost: "bg-transparent text-foreground hover:bg-slate-100",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
