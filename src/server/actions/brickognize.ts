"use server";

import { requireAdmin } from "@/lib/admin";

// Brickognize-Vorhersage-Resultat (vereinfacht).
export interface BrickognizePrediction {
  id: string;
  name: string;
  type: string; // "minifig" | "part" | "set" | "gear" | ...
  score: number; // 0..1
  externalSites?: { name: string; url: string }[];
}

export interface BrickognizeResult {
  ok: boolean;
  predictions: BrickognizePrediction[];
  error?: string;
}

// Ruft die Brickognize-API mit einer Bild-URL auf und gibt die besten Treffer zurück.
export async function lookupBrickognizeFromUrl(imageUrl: string): Promise<BrickognizeResult> {
  await requireAdmin();

  try {
    // Bild herunterladen — Brickognize akzeptiert ein Multipart-Upload.
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return { ok: false, predictions: [], error: `Bild konnte nicht geladen werden (HTTP ${imgRes.status}).` };
    }
    const buf = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

    const form = new FormData();
    const blob = new Blob([buf], { type: contentType });
    form.append("query_image", blob, "upload.jpg");

    const apiRes = await fetch("https://api.brickognize.com/predict/", {
      method: "POST",
      body: form,
    });
    if (!apiRes.ok) {
      return { ok: false, predictions: [], error: `Brickognize-Fehler (HTTP ${apiRes.status}).` };
    }
    const data = await apiRes.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const predictions: BrickognizePrediction[] = items.slice(0, 5).map((it: Record<string, unknown>) => ({
      id: String(it.id ?? ""),
      name: String(it.name ?? ""),
      type: String(it.type ?? ""),
      score: typeof it.score === "number" ? it.score : 0,
      externalSites: Array.isArray(it.external_sites)
        ? (it.external_sites as { name?: unknown; url?: unknown }[]).map((s) => ({
            name: String(s.name ?? ""),
            url: String(s.url ?? ""),
          }))
        : undefined,
    }));
    return { ok: true, predictions };
  } catch (err) {
    console.error("[brickognize]", err);
    return { ok: false, predictions: [], error: "Bricklink-Erkennung fehlgeschlagen." };
  }
}
