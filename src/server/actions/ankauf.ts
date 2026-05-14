"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  ankaufSubmitSchema,
  ankaufAdminResponseSchema,
  ankaufShipSchema,
  type AnkaufStatus,
} from "@/lib/validation";
import {
  ankaufConfirmationEmail,
  ankaufResponseEmail,
  ankaufCompletedEmail,
  ankaufReturnedEmail,
  ankaufAdminNotificationEmail,
} from "@/lib/email";
import type { ActionResult } from "./auth";

const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";

// --- Öffentliche Aktion: Ankauf-Anfrage einreichen ---

export async function submitAnkaufRequest(data: {
  name: string;
  email: string;
  phone?: string | null;
  description: string;
  desiredPrice: number;
  images: { url: string; key: string }[];
  website?: string;
}): Promise<ActionResult<{ publicToken: string }>> {
  const parsed = ankaufSubmitSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Bitte Eingaben prüfen.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, phone, description, desiredPrice, images } = parsed.data;
  if (parsed.data.website) return { ok: false, error: "Anfrage nicht möglich." };

  const request = await db.ankaufRequest.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone,
      description,
      desiredPrice,
      images: {
        create: images.map((img) => ({
          url: img.url,
          key: img.key,
        })),
      },
    },
  });

  const statusUrl = `${shopUrl}/ankauf/status?token=${request.publicToken}`;

  // Bestätigungsmail an Kunden
  await sendEmail({
    to: email,
    subject: "Deine Ankauf-Anfrage bei SL Minifigs",
    react: ankaufConfirmationEmail({ name, statusUrl, desiredPrice }),
  });

  // Benachrichtigung an Admin
  const adminEmail = process.env.SMTP_USER ?? "";
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `Neue Ankauf-Anfrage von ${name}`,
      react: ankaufAdminNotificationEmail({
        name,
        email,
        description,
        desiredPrice,
        adminUrl: `${shopUrl}/admin/ankauf/${request.id}`,
      }),
    });
  }

  return { ok: true, data: { publicToken: request.publicToken } };
}

// --- Öffentliche Aktion: Kunden bestätigt Gegenangebot ---

export async function acceptCounterOffer(formData: FormData): Promise<ActionResult> {
  const token = formData.get("token") as string;
  if (!token) return { ok: false, error: "Ungültiger Token." };

  const request = await db.ankaufRequest.findUnique({ where: { publicToken: token } });
  if (!request || request.status !== "COUNTER_OFFER") {
    return { ok: false, error: "Anfrage nicht gefunden oder falscher Status." };
  }

  await db.ankaufRequest.update({
    where: { id: request.id },
    data: { status: "WAITING_SHIPMENT" },
  });

  return { ok: true };
}

export async function declineCounterOffer(formData: FormData): Promise<ActionResult> {
  const token = formData.get("token") as string;
  if (!token) return { ok: false, error: "Ungültiger Token." };

  const request = await db.ankaufRequest.findUnique({ where: { publicToken: token } });
  if (!request || request.status !== "COUNTER_OFFER") {
    return { ok: false, error: "Anfrage nicht gefunden oder falscher Status." };
  }

  await db.ankaufRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED" },
  });

  return { ok: true };
}

// --- Öffentliche Aktion: Kunde gibt Versandinformationen ein ---

export async function submitShippingInfo(formData: FormData): Promise<ActionResult> {
  const token = formData.get("token") as string;
  const raw = {
    shippingMethod: formData.get("shippingMethod"),
    trackingCode: formData.get("trackingCode") || null,
  };

  if (!token) return { ok: false, error: "Ungültiger Token." };

  const parsed = ankaufShipSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Bitte Felder prüfen.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const request = await db.ankaufRequest.findUnique({ where: { publicToken: token } });
  if (!request || !["WAITING_SHIPMENT", "ACCEPTED"].includes(request.status)) {
    return { ok: false, error: "Anfrage nicht gefunden oder falscher Status." };
  }

  await db.ankaufRequest.update({
    where: { id: request.id },
    data: {
      status: "SHIPPED",
      shippingMethod: parsed.data.shippingMethod,
      trackingCode: parsed.data.trackingCode,
      shippedAt: new Date(),
    },
  });

  return { ok: true };
}

// --- Admin-Aktionen ---

export async function adminRespondAnkauf(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const raw = {
    status: formData.get("status"),
    adminNote: formData.get("adminNote") || null,
    offeredPrice: formData.get("offeredPrice") ? Number(formData.get("offeredPrice")) : null,
    payoutAmount: formData.get("payoutAmount") ? Number(formData.get("payoutAmount")) : null,
    payoutNote: formData.get("payoutNote") || null,
  };

  const parsed = ankaufAdminResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Ungültige Eingaben." };
  }

  const request = await db.ankaufRequest.findUnique({ where: { id } });
  if (!request) return { ok: false, error: "Anfrage nicht gefunden." };

  const { status, adminNote, offeredPrice, payoutAmount, payoutNote } = parsed.data;

  const updateData: Record<string, unknown> = {
    status,
    adminNote,
    offeredPrice,
    payoutAmount,
    payoutNote,
  };

  const respondingStatuses: AnkaufStatus[] = ["ACCEPTED", "COUNTER_OFFER", "REJECTED"];
  if (respondingStatuses.includes(status as AnkaufStatus)) {
    updateData.respondedAt = new Date();
  }
  if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  await db.ankaufRequest.update({ where: { id }, data: updateData });

  const statusUrl = `${shopUrl}/ankauf/status?token=${request.publicToken}`;

  // E-Mail-Benachrichtigung
  if (respondingStatuses.includes(status as AnkaufStatus)) {
    await sendEmail({
      to: request.email,
      subject: "Antwort auf deine Ankauf-Anfrage",
      react: ankaufResponseEmail({
        name: request.name,
        statusUrl,
        status: status as AnkaufStatus,
        adminNote: adminNote ?? undefined,
        offeredPrice: offeredPrice ?? undefined,
        desiredPrice: Number(request.desiredPrice),
      }),
    });
  }

  if (status === "COMPLETED") {
    await sendEmail({
      to: request.email,
      subject: "Zahlung für deine Artikel veranlasst",
      react: ankaufCompletedEmail({
        name: request.name,
        payoutAmount: payoutAmount ?? Number(request.offeredPrice ?? request.desiredPrice),
        payoutNote: payoutNote ?? undefined,
      }),
    });
  }

  if (status === "RETURNED") {
    await sendEmail({
      to: request.email,
      subject: "Deine Artikel werden zurückgesandt",
      react: ankaufReturnedEmail({
        name: request.name,
        adminNote: adminNote ?? undefined,
      }),
    });
  }

  return { ok: true };
}

// --- Soft/Hard Delete ---

export async function softDeleteAnkauf(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const request = await db.ankaufRequest.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
    if (!request) return { ok: false, error: "Nicht gefunden." };
    if (request.deletedAt) return { ok: true };
    await db.ankaufRequest.update({ where: { id }, data: { deletedAt: new Date() } });
    await logAudit({
      userId: admin.id,
      action: "ANKAUF_SOFT_DELETED",
      entity: "AnkaufRequest",
      entityId: id,
    });
    revalidatePath("/admin/ankauf");
    revalidatePath("/admin/papierkorb");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Löschen." };
  }
}

export async function restoreAnkauf(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await db.ankaufRequest.update({ where: { id }, data: { deletedAt: null } });
    await logAudit({
      userId: admin.id,
      action: "ANKAUF_RESTORED",
      entity: "AnkaufRequest",
      entityId: id,
    });
    revalidatePath("/admin/ankauf");
    revalidatePath("/admin/papierkorb");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim Wiederherstellen." };
  }
}

export async function hardDeleteAnkauf(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const request = await db.ankaufRequest.findUnique({
      where: { id },
      select: { id: true, deletedAt: true, name: true, images: { select: { url: true } } },
    });
    if (!request) return { ok: false, error: "Nicht gefunden." };
    if (!request.deletedAt) return { ok: false, error: "Anfrage muss zuerst in den Papierkorb verschoben werden." };

    // Bilder im Vercel Blob löschen (best-effort, blockiert das DB-Delete nicht).
    const urls = request.images.map((i) => i.url).filter(Boolean);
    if (urls.length > 0) {
      try {
        await del(urls);
      } catch (err) {
        console.error("Vercel Blob delete failed:", err);
      }
    }

    // AnkaufImage hat onDelete: Cascade → wird automatisch mitgelöscht.
    await db.ankaufRequest.delete({ where: { id } });

    await logAudit({
      userId: admin.id,
      action: "ANKAUF_HARD_DELETED",
      entity: "AnkaufRequest",
      entityId: id,
      metadata: { name: request.name, imageCount: urls.length },
    });
    revalidatePath("/admin/papierkorb");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Verboten" };
    console.error(e);
    return { ok: false, error: "Fehler beim endgültigen Löschen." };
  }
}

export async function softDeleteAnkaufAction(formData: FormData) {
  const id = formData.get("id") as string;
  const result = await softDeleteAnkauf(id);
  if (!result.ok) {
    redirect(`/admin/ankauf/${id}?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/admin/ankauf");
}

export async function restoreAnkaufAction(formData: FormData) {
  const id = formData.get("id") as string;
  await restoreAnkauf(id);
  redirect("/admin/papierkorb");
}

export async function hardDeleteAnkaufAction(formData: FormData) {
  const id = formData.get("id") as string;
  await hardDeleteAnkauf(id);
  redirect("/admin/papierkorb");
}
