"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";

type QuantityStepperProps = {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: "md" | "sm";
};

export function QuantityStepper({ value, max, onChange, label, size = "md" }: QuantityStepperProps) {
  const height = size === "md" ? "h-[50px]" : "h-10";
  const width = size === "md" ? "w-11" : "w-9";
  return (
    <div role="group" aria-label={label} className={`inline-flex items-center border border-line-strong ${height}`}>
      <button
        type="button"
        className={`inline-flex h-full ${width} items-center justify-center disabled:opacity-30`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Quitar una pieza"
      >
        <MinusIcon size={16} />
      </button>
      <output className="min-w-8 text-center text-[0.95rem]" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={`inline-flex h-full ${width} items-center justify-center disabled:opacity-30`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Agregar una pieza"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
