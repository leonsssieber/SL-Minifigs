"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BlobUploader } from "@/components/blob-uploader";
import { createProduct, updateProduct } from "@/server/actions/products";
import { lookupBrickognizeFromUrl } from "@/server/actions/brickognize";
import { slugify, decimalToNumber } from "@/lib/utils";

interface ShippingOptionState {
  methodId: string;
  isRecommended: boolean;
}

interface ProductFormData {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string | null;
  categoryId?: string;
  condition?: string;
  price?: number | string | { toString(): string };
  comparePrice?: number | string | { toString(): string } | null;
  stockType?: string;
  stockQuantity?: number;
  sku?: string | null;
  legoSetNumber?: string | null;
  weightGrams?: number | null;
  shippingCategory?: string | null;
  customShippingMethodId?: string | null;
  active?: boolean;
  featured?: boolean;
  images?: { url: string; key?: string | null; alt?: string | null }[];
  shippingOptions?: ShippingOptionState[];
}

interface Props {
  product?: ProductFormData;
  categories: { id: string; name: string }[];
  shippingMethods: { id: string; name: string }[];
}

export function ProductForm({ product, categories, shippingMethods }: Props) {
  const router = useRouter();
  const isEdit = !!product?.id;
  const [pending, start] = useTransition();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product?.slug);
  const [legoSetNumber, setLegoSetNumber] = useState(product?.legoSetNumber ?? "");
  const [images, setImages] = useState<{ url: string; key?: string | null; alt?: string | null }[]>(
    product?.images ?? []
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [stockType, setStockType] = useState(product?.stockType ?? "UNIQUE");
  const [shippingOpts, setShippingOpts] = useState<ShippingOptionState[]>(
    product?.shippingOptions ?? []
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [recognizing, setRecognizing] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    fd.set("active", active ? "true" : "false");
    fd.set("featured", featured ? "true" : "false");
    fd.set("images", JSON.stringify(images));
    fd.set("stockType", stockType);
    fd.set("shippingOptions", JSON.stringify(shippingOpts));

    start(async () => {
      const result = isEdit
        ? await updateProduct(product!.id!, fd)
        : await createProduct(fd);

      if (result.ok) {
        toast.success(isEdit ? "Gespeichert" : "Produkt angelegt");
        router.push("/admin/produkte");
        router.refresh();
      } else {
        toast.error(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    });
  }

  function toggleMethod(methodId: string, on: boolean) {
    setShippingOpts((arr) => {
      if (on) {
        if (arr.some((o) => o.methodId === methodId)) return arr;
        return [...arr, { methodId, isRecommended: arr.length === 0 }];
      }
      return arr.filter((o) => o.methodId !== methodId);
    });
  }

  function setRecommended(methodId: string) {
    setShippingOpts((arr) =>
      arr.map((o) => ({ ...o, isRecommended: o.methodId === methodId }))
    );
  }

  async function runRecognition(imageUrl: string) {
    setRecognizing(true);
    try {
      const result = await lookupBrickognizeFromUrl(imageUrl);
      if (!result.ok || result.predictions.length === 0) {
        toast.error(result.error ?? "Keine Erkennung möglich.");
        return;
      }
      const top = result.predictions[0];
      // Felder nur befüllen, wenn sie leer sind (kein Überschreiben).
      if (!name && top.name) {
        setName(top.name);
        if (!slugTouched) setSlug(slugify(top.name));
      }
      if (!legoSetNumber && top.id) {
        setLegoSetNumber(top.id);
      }
      toast.success(`Erkannt: ${top.name} (${top.id})`);
    } finally {
      setRecognizing(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-4 sm:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/produkte">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{isEdit ? "Produkt bearbeiten" : "Neues Produkt"}</h1>
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert…" : isEdit ? "Speichern" : "Anlegen"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Allgemein</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  required
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL-Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
                  required
                />
                <p className="text-xs text-muted-foreground break-all">/produkte/{slug || "..."}</p>
                {errors.slug && <p className="text-xs text-destructive">{errors.slug[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Kurzbeschreibung</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={product?.shortDescription ?? ""}
                  placeholder="Optional, max. 500 Zeichen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung *</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={8}
                  defaultValue={product?.description ?? ""}
                  required
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description[0]}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span>Bilder</span>
                {images.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => runRecognition(images[0].url)}
                    disabled={recognizing}
                    className="gap-1.5"
                  >
                    {recognizing
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Erkenne…</>
                      : <><Sparkles className="h-3.5 w-3.5" /> Brickognize</>}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
                      <Image src={img.url} alt={img.alt ?? ""} fill sizes="200px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((arr) => arr.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-background/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Entfernen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                          Haupt
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {images.length < 10 && (
                <BlobUploader
                  endpoint="productImage"
                  maxFiles={10 - images.length}
                  onUploaded={(files) => {
                    const newImgs = files.map((f) => ({ url: f.url, key: f.pathname, alt: name }));
                    setImages((arr) => [...arr, ...newImgs].slice(0, 10));
                    toast.success(`${files.length} Bild(er) hochgeladen`);
                    // Wenn vorher keine Bilder vorhanden waren UND Name/Teilenummer leer → automatisch erkennen.
                    if (images.length === 0 && newImgs.length > 0 && (!name || !legoSetNumber)) {
                      runRecognition(newImgs[0].url);
                    }
                  }}
                  onError={(msg) => toast.error(`Upload fehlgeschlagen: ${msg}`)}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Max. 10 Bilder, je 4 MB. Erstes Bild = Hauptbild. Lade ein Foto hoch, um Name und Teilenummer automatisch via Brickognize zu erkennen.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Kategorisierung</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategorie *</Label>
                <Select name="categoryId" defaultValue={product?.categoryId} required>
                  <SelectTrigger><SelectValue placeholder="Wähle..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Zustand *</Label>
                <Select name="condition" defaultValue={product?.condition ?? "NEU"} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEU">Neu (OVP)</SelectItem>
                    <SelectItem value="WIE_NEU">Wie Neu</SelectItem>
                    <SelectItem value="GEBRAUCHT_GUT">Gebraucht – Gut</SelectItem>
                    <SelectItem value="GEBRAUCHT_FAIR">Gebraucht – Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legoSetNumber">LEGO Teilenummer</Label>
                <Input
                  id="legoSetNumber"
                  name="legoSetNumber"
                  value={legoSetNumber}
                  onChange={(e) => setLegoSetNumber(e.target.value)}
                  placeholder="z.B. sw1010 oder 75300"
                />
                <p className="text-xs text-muted-foreground">Für Sets, Minifiguren oder Einzelteile (Bricklink-/Rebrickable-ID).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} placeholder="Interne Artikel-Nr." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preis &amp; Bestand</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preis (CHF) *</Label>
                <Input
                  id="price" name="price" type="number" step="0.05" min="0" required
                  defaultValue={product?.price != null ? decimalToNumber(product.price) : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice">Vergleichspreis (durchgestrichen)</Label>
                <Input
                  id="comparePrice" name="comparePrice" type="number" step="0.05" min="0"
                  defaultValue={product?.comparePrice != null ? decimalToNumber(product.comparePrice) : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Bestandstyp</Label>
                <Select value={stockType} onValueChange={setStockType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNIQUE">Unikat (1 Stück)</SelectItem>
                    <SelectItem value="MULTIPLE">Mehrere Stück</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Menge im Lager</Label>
                <Input
                  id="stockQuantity" name="stockQuantity" type="number" min="0" step="1"
                  defaultValue={product?.stockQuantity ?? 1}
                  disabled={stockType === "UNIQUE"}
                />
                {stockType === "UNIQUE" && (
                  <p className="text-xs text-muted-foreground">Bei Unikat fix 1 — wird nach Verkauf 0.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Versand</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weightGrams">Gewicht (Gramm)</Label>
                <Input id="weightGrams" name="weightGrams" type="number" min="0" step="1" defaultValue={product?.weightGrams ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingCategory">Versand-Kategorie</Label>
                <Select name="shippingCategory" defaultValue={product?.shippingCategory ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Keine" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minifigure">Minifigur</SelectItem>
                    <SelectItem value="small_set">Kleines Set</SelectItem>
                    <SelectItem value="large_set">Grosses Set</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Wird zur Berechnung der Versandkosten verwendet.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Verfügbare Versandmethoden</Label>
                  <p className="text-xs text-muted-foreground">
                    Wähle alle Methoden, die der Kunde wählen darf. Markiere eine als „empfohlen". Ohne Auswahl sind alle aktiven Methoden zulässig.
                  </p>
                </div>
                {shippingMethods.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Keine Versandmethoden konfiguriert.</p>
                ) : (
                  <div className="space-y-2">
                    {shippingMethods.map((m) => {
                      const entry = shippingOpts.find((o) => o.methodId === m.id);
                      const checked = !!entry;
                      const isRec = entry?.isRecommended ?? false;
                      return (
                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-md border">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => toggleMethod(m.id, !!c)}
                          />
                          <span className="flex-1 text-sm">{m.name}</span>
                          {checked && (
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <input
                                type="radio"
                                name="recommended-method"
                                checked={isRec}
                                onChange={() => setRecommended(m.id)}
                                className="h-3.5 w-3.5"
                              />
                              empfohlen
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customShippingMethodId">Versandmethode erzwingen (Legacy, optional)</Label>
                <Select name="customShippingMethodId" defaultValue={product?.customShippingMethodId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Nur setzen, wenn der Kunde keine Wahl haben soll. Mehrere wählbare Methoden bitte oben markieren.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sichtbarkeit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aktiv</Label>
                  <p className="text-xs text-muted-foreground">Im Shop sichtbar</p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured (Highlights)</Label>
                  <p className="text-xs text-muted-foreground">Auf Startseite hervorgehoben</p>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
