import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: (describedBy: string | undefined) => ReactNode;
};

/** Label + control + hint/error, wired with aria-describedby. */
export function FormField({ id, label, error, hint, optional = false, className = "", children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="font-normal text-ink-soft"> (opcional)</span> : null}
      </label>
      {children(describedBy)}
      {hint && !error ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
