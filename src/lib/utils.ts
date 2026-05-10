import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCHF(amount: number | string | { toString(): string }): string {
  const num = typeof amount === "number" ? amount : Number(amount.toString());
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `LR-${year}-${random}`;
}

export function conditionLabel(condition: string): string {
  const map: Record<string, string> = {
    NEU: "Neu",
    WIE_NEU: "Wie Neu",
    GEBRAUCHT_GUT: "Gebraucht – Gut",
    GEBRAUCHT_FAIR: "Gebraucht – Fair",
  };
  return map[condition] ?? condition;
}

export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Offen",
    PAID: "Bezahlt",
    PROCESSING: "In Bearbeitung",
    SHIPPED: "Versendet",
    COMPLETED: "Abgeschlossen",
    CANCELLED: "Storniert",
    REFUNDED: "Rückerstattet",
  };
  return map[status] ?? status;
}

export function decimalToNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}
