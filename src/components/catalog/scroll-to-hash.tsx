"use client";

import { useEffect } from "react";

/**
 * The catalog streams in behind a Suspense boundary, so on client navigation the router
 * looks for `#id` before the element exists and cannot scroll to it. This retries once
 * the content has mounted.
 */
export function ScrollToHash({ id }: { id: string }) {
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [id]);
  return null;
}
