"use client";

import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent } from "react";

/**
 * Menu links navigate inside a transition so the header can show progress while the
 * next catalog page renders. Without it the menu closes and nothing seems to happen
 * until the server answers, which reads as a dead link.
 *
 * Attach `handleClickCapture` with `onClickCapture`: it must run before next/link's own
 * click handler, which then sees `defaultPrevented` and skips its navigation; otherwise
 * both navigate and race each other.
 */
export function useMenuNavigation(onNavigate: () => void) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;
    onNavigate();
    // Let the browser handle new-tab/download clicks and external links natively.
    const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    const isNewTab = anchor.target === "_blank" || anchor.hasAttribute("download");
    if (!isPlainClick || isNewTab || anchor.origin !== window.location.origin) return;
    event.preventDefault();
    const href = `${anchor.pathname}${anchor.search}${anchor.hash}`;
    startTransition(() => router.push(href));
  };

  return { isNavigating, handleClickCapture };
}
