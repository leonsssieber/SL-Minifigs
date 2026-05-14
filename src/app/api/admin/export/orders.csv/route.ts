import { NextResponse } from "next/server";
import { isFullyAuthedAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { decimalToNumber } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isFullyAuthedAdmin())) return new NextResponse("Forbidden", { status: 403 });

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { email: true } } },
  });

  const rows = orders.map((o) => ({
    "Bestellnummer": o.orderNumber,
    "Datum": o.createdAt.toISOString(),
    "Status": o.status,
    "Bezahlung": o.paymentProvider,
    "Bezahlstatus": o.paymentStatus,
    "Email": o.user?.email ?? o.guestEmail ?? "",
    "Vorname": o.shippingFirstName,
    "Nachname": o.shippingLastName,
    "Firma": o.shippingCompany ?? "",
    "Strasse": o.shippingStreet,
    "Strasse2": o.shippingStreet2 ?? "",
    "PLZ": o.shippingZip,
    "Ort": o.shippingCity,
    "Land": o.shippingCountry,
    "Telefon": o.shippingPhone ?? "",
    "Versandmethode": o.shippingMethodName,
    "Tracking": o.trackingNumber ?? "",
    "Anzahl Items": o.items.reduce((sum, i) => sum + i.quantity, 0),
    "Items": o.items.map((i) => `${i.quantity}× ${i.productName}`).join("; "),
    "Zwischensumme": decimalToNumber(o.subtotal),
    "Versand": decimalToNumber(o.shippingCost),
    "Total": decimalToNumber(o.total),
    "Währung": o.currency,
    "Bezahlt am": o.paidAt?.toISOString() ?? "",
    "Versendet am": o.shippedAt?.toISOString() ?? "",
  }));

  const csv = toCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bestellungen-${date}.csv"`,
    },
  });
}
