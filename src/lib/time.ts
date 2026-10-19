import { cacheLife } from "next/cache";

/** Current year for the copyright line; cached so pages can still be prerendered. */
export async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
