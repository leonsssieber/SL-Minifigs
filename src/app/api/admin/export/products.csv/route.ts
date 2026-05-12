import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { decimalToNumber } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return new NextResponse("Forbidden", { status: 403 });

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  const rows = products.map((p) => ({
    "ID": p.id,
    "Slug": p.slug,
    "Name": p.name,
    "Kategorie": p.category.name,
    "SKU": p.sku ?? "",
    "LEGO Teilenummer": p.legoSetNumber ?? "",
    "Zustand": p.condition,
    "Preis (CHF)": decimalToNumber(p.price),
    "Vergleichspreis (CHF)": p.comparePrice != null ? decimalToNumber(p.comparePrice) : "",
    "Bestandstyp": p.stockType,
    "Bestand": p.stockQuantity,
    "Gewicht (g)": p.weightGrams ?? "",
    "Versand-Kategorie": p.shippingCategory ?? "",
    "Aktiv": p.active ? "Ja" : "Nein",
    "Featured": p.featured ? "Ja" : "Nein",
    "Erstellt": p.createdAt.toISOString(),
  }));

  const csv = toCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="produkte-${date}.csv"`,
    },
  });
}
