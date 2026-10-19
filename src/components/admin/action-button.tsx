"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/app/admin/actions";

type ActionButtonProps = {
  action: () => Promise<ActionResult>;
  label: string;
  pendingLabel: string;
  successMessage: string;
  confirmMessage?: string;
  variant?: "primary" | "outline" | "danger";
  redirectTo?: string;
};

/** Runs a Server Action from a button with confirmation, pending state and feedback. */
export function ActionButton({
  action,
  label,
  pendingLabel,
  successMessage,
  confirmMessage,
  variant = "outline",
  redirectTo,
}: ActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        className={`btn btn-sm btn-${variant}`}
        disabled={isPending}
        aria-busy={isPending}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setFeedback(null);
          startTransition(async () => {
            const result = await action();
            if (!result.ok) {
              setFeedback({ tone: "error", text: result.message });
              return;
            }
            setFeedback({ tone: "ok", text: successMessage });
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          });
        }}
      >
        {isPending ? pendingLabel : label}
      </button>
      <span aria-live="polite" className={`text-[0.8125rem] ${feedback?.tone === "error" ? "text-error" : "text-success"}`}>
        {feedback?.text}
      </span>
    </div>
  );
}
