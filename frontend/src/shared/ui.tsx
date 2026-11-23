import clsx from "clsx";
import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return clsx(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    {
      "bg-fg text-bg hover:bg-white": variant === "primary",
      "border border-border bg-transparent text-fg hover:border-border-strong hover:bg-surface-2":
        variant === "secondary",
      "text-muted hover:bg-surface-2 hover:text-fg": variant === "ghost",
      "border border-danger/30 text-danger hover:bg-danger/10": variant === "danger",
      "h-8 px-3 text-[13px]": size === "sm",
      "h-9 px-4 text-sm": size === "md",
    },
    className
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  )
);
Button.displayName = "Button";

const fieldStyles =
  "w-full rounded-md border border-border bg-surface text-sm text-fg placeholder:text-muted-2 transition-colors hover:border-border-strong focus:border-border-strong disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={clsx(fieldStyles, "h-10 px-3", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={clsx(fieldStyles, "min-h-28 px-3 py-2.5", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={clsx(fieldStyles, "h-10 px-3 pr-8", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-2">{hint}</p>}
    </div>
  );
}

export function Progress({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={label}
      className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div
        className="h-full rounded-full bg-fg transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-surface-2", className)} />;
}
