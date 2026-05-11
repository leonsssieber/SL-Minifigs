"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BlobEndpoint = "productImage" | "ankaufImage";

export interface UploadedBlob {
  url: string;
  pathname: string;
}

interface Props {
  endpoint: BlobEndpoint;
  maxFiles?: number;
  onUploaded: (files: UploadedBlob[]) => void;
  onError?: (msg: string) => void;
  className?: string;
  label?: string;
  helperText?: string;
}

export function BlobUploader({
  endpoint,
  maxFiles = 10,
  onUploaded,
  onError,
  className,
  label = "Bilder auswählen",
  helperText,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    if (files.length > maxFiles) {
      onError?.(`Max. ${maxFiles} Datei(en) auf einmal.`);
      return;
    }

    setIsUploading(true);
    setProgress({ done: 0, total: files.length });
    const uploaded: UploadedBlob[] = [];

    try {
      for (const file of files) {
        try {
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/blob/upload",
            clientPayload: JSON.stringify({ endpoint }),
            contentType: file.type,
          });
          uploaded.push({ url: blob.url, pathname: blob.pathname });
        } catch (err) {
          // Versuche, eine sinnvolle Fehlermeldung aus dem Server zu lesen
          let msg = err instanceof Error ? err.message : "Upload fehlgeschlagen";
          // Vercel Blob werfen oft generische Fehler — versuche selbst zu fetchen
          if (msg.includes("Failed to retrieve") || msg.includes("token")) {
            try {
              const res = await fetch("/api/blob/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "blob.generate-client-token",
                  payload: {
                    pathname: file.name,
                    callbackUrl: window.location.origin + "/api/blob/upload",
                    clientPayload: JSON.stringify({ endpoint }),
                  },
                }),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.error) msg = data.error;
              }
            } catch {
              // ignore — fall back to original message
            }
          }
          throw new Error(msg);
        }
        setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
      }
      onUploaded(uploaded);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload fehlgeschlagen";
      console.error("[BlobUploader] Fehler:", err);
      onError?.(msg);
    } finally {
      setIsUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (isUploading) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    void uploadFiles(files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        "rounded-md border-2 border-dashed p-6 text-center transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30",
        isUploading && "opacity-60 pointer-events-none",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          void uploadFiles(files);
        }}
      />

      <div className="flex flex-col items-center gap-2">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Lädt hoch {progress ? `(${progress.done}/${progress.total})` : ""}…
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-primary hover:underline"
            >
              {label}
            </button>
            <p className="text-xs text-muted-foreground">
              {helperText ?? "Oder Dateien hierhin ziehen"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
