"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { BlobUploader } from "@/components/blob-uploader";
import { submitAnkaufRequest } from "@/server/actions/ankauf";
import { ankaufSubmitSchema } from "@/lib/validation";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, ImageIcon } from "lucide-react";

interface UploadedImage {
  url: string;
  key: string;
}

// Client-Form-Schema ohne images — Bilder werden separat im State verwaltet
const ankaufFormClientSchema = ankaufSubmitSchema.omit({ images: true });
type AnkaufFormClientInput = z.infer<typeof ankaufFormClientSchema>;

export function AnkaufForm() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnkaufFormClientInput>({
    resolver: zodResolver(ankaufFormClientSchema),
  });

  const onSubmit = async (data: AnkaufFormClientInput) => {
    if (images.length === 0) {
      setServerError("Bitte mindestens 1 Bild hochladen.");
      return;
    }
    setSubmitting(true);
    setServerError(null);

    const result = await submitAnkaufRequest({ ...data, images });
    if (!result.ok) {
      setServerError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/ankauf/status?token=${result.data!.publicToken}&neu=1`);
  };

  const removeImage = (key: string) => {
    setImages((prev) => prev.filter((img) => img.key !== key));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Honeypot */}
      <input type="text" {...register("website")} className="hidden" aria-hidden="true" tabIndex={-1} />

      {serverError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Vor- und Nachname *</Label>
          <Input id="name" {...register("name")} placeholder="Max Mustermann" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email-Adresse *</Label>
          <Input id="email" type="email" {...register("email")} placeholder="max@beispiel.ch" />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefonnummer (optional)</Label>
        <Input id="phone" type="tel" {...register("phone")} placeholder="+41 79 000 00 00" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung deiner Artikel *</Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={5}
          placeholder="Beschreibe deine LEGO-Figuren, Sets oder sonstige Artikel so genau wie möglich. Zustand, Vollständigkeit, Besonderheiten..."
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="desiredPrice">Wunschpreis (CHF) *</Label>
        <Input
          id="desiredPrice"
          type="number"
          step="0.01"
          min="0.50"
          {...register("desiredPrice")}
          placeholder="25.00"
          className="max-w-[200px]"
        />
        {errors.desiredPrice && <p className="text-sm text-destructive">{errors.desiredPrice.message}</p>}
      </div>

      {/* Bild-Upload */}
      <div className="space-y-3">
        <Label>Bilder (1–8) *</Label>
        <p className="text-sm text-muted-foreground">
          Lade gute Fotos deiner Artikel hoch — alle Seiten, eventuelle Schäden etc.
        </p>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.key} className="relative group rounded-md overflow-hidden border bg-muted aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => removeImage(img.key)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 8 && (
              <div className="flex items-center justify-center border-2 border-dashed rounded-md aspect-square text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
          </div>
        )}

        {images.length < 8 && (
          <BlobUploader
            endpoint="ankaufImage"
            maxFiles={8 - images.length}
            onUploaded={(files) => {
              setUploadError(null);
              setImages((prev) => [
                ...prev,
                ...files.map((f) => ({ url: f.url, key: f.pathname })),
              ]);
            }}
            onError={(msg) => setUploadError(msg)}
            helperText="JPG, PNG, WEBP, GIF — max. 8 MB pro Bild"
          />
        )}
        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        {images.length === 0 && serverError && (
          <p className="text-sm text-destructive">Mindestens 1 Bild erforderlich.</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Wird eingereicht..." : "Anfrage absenden"}
      </Button>
    </form>
  );
}
