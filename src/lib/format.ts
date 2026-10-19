import { CURRENCY, LOCALE } from "./constants";

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

export function formatOrderNumber(orderNumber: number): string {
  return `NX-${String(orderNumber).padStart(5, "0")}`;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
