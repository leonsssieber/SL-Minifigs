// Vercel Blob client-upload handler.
// Client lädt direkt zu Vercel Blob (umgeht die 4.5 MB Body-Size-Limit von Serverless Functions).
// Wir signieren nur einen kurzlebigen Token und prüfen Auth.

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isFullyAuthedAdmin } from "@/lib/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request): Promise<NextResponse> {
  // Sanity-Check: Vercel Blob Token muss gesetzt sein
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[blob] BLOB_READ_WRITE_TOKEN fehlt in .env");
    return NextResponse.json(
      {
        error:
          "Server-Konfiguration unvollständig: BLOB_READ_WRITE_TOKEN fehlt. " +
          "Erstelle einen Blob-Store auf vercel.com/dashboard → Storage → Blob, " +
          "und kopiere den Token in .env",
      },
      { status: 500 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayloadRaw) => {
        let payload: { endpoint?: string } = {};
        try {
          payload = clientPayloadRaw ? JSON.parse(clientPayloadRaw) : {};
        } catch {
          // ignore invalid payload
        }
        const endpoint = payload.endpoint ?? "ankaufImage";

        if (endpoint === "productImage") {
          // Nur voll-authentifizierter Admin (mit 2FA) darf Produktbilder hochladen
          if (!(await isFullyAuthedAdmin())) {
            throw new Error("Nicht autorisiert");
          }
          const session = await auth();
          return {
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: 4 * 1024 * 1024, // 4 MB
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ endpoint, userId: session?.user?.id }),
          };
        }

        if (endpoint === "ankaufImage") {
          // Öffentlich (auch Gäste), aber strenger Filter + Rate-Limit,
          // damit niemand den Blob-Speicher vollmüllen kann.
          const ip = getClientIp(request.headers);
          const rl = await rateLimit(`blob-upload:${ip}`, 30, 3600);
          if (!rl.success) {
            throw new Error("Zu viele Uploads. Bitte später erneut versuchen.");
          }
          return {
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: 8 * 1024 * 1024, // 8 MB
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ endpoint }),
          };
        }

        throw new Error(`Unbekannter Endpoint: ${endpoint}`);
      },
      onUploadCompleted: async ({ blob }) => {
        // In Production wird dies via Webhook von Vercel ausgelöst.
        // Lokal (localhost) kommt der Webhook nicht durch — das ist OK,
        // der Client kennt die URL bereits nach dem PUT.
        console.log("[blob] Upload abgeschlossen:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload-Fehler";
    console.error("[blob] Upload-Fehler:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
