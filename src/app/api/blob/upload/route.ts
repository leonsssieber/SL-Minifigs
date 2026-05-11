// Vercel Blob client-upload handler.
// Client lädt direkt zu Vercel Blob (umgeht die 4.5 MB Body-Size-Limit von Serverless Functions).
// Wir signieren nur einen kurzlebigen Token und prüfen Auth.

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        const payload = clientPayloadRaw ? JSON.parse(clientPayloadRaw) : {};
        const endpoint: string = payload?.endpoint ?? "ankaufImage";

        if (endpoint === "productImage") {
          // Nur Admin darf Produktbilder hochladen
          const session = await auth();
          if (!session?.user || !session.user.isAdmin) {
            throw new Error("Nicht autorisiert");
          }
          return {
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: 4 * 1024 * 1024, // 4 MB
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ endpoint, userId: session.user.id }),
          };
        }

        if (endpoint === "ankaufImage") {
          // Öffentlich (auch Gäste), aber strenger Filter
          return {
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: 8 * 1024 * 1024, // 8 MB
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ endpoint }),
          };
        }

        throw new Error("Unbekannter Endpoint");
      },
      onUploadCompleted: async () => {
        // No-op: Client kümmert sich um DB-Eintrag nach Upload.
        // (Webhook von Vercel kommt nur in Production an, daher Client-Side Tracking.)
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload-Fehler";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
