import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const order = await db.order.findUnique({
    where: { id },
    select: { id: true, userId: true, orderNumber: true },
  });
  if (!order) return new NextResponse("Not found", { status: 404 });

  // Erlaubt: Admin oder eigentümer
  const isOwner = order.userId === session.user.id;
  if (!session.user.isAdmin && !isOwner) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const buffer = await generateInvoicePDF(id, db);
  if (!buffer) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rechnung-${order.orderNumber}.pdf"`,
    },
  });
}
