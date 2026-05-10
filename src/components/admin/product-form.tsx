"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropzone } from "@/lib/uploadthing";
import { createProduct, updateProduct } from "@/server/actions/products";
import { slugify, decimalToNumber } from "@/lib/utils";

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
  const [images, setImages] = useState<{ url: string; key?: string | null; alt?: string | null }[]>(
    product?.images ?? []
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [stockType, setStockType] = useState(product?.stockType ?? "UNIQUE");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    fd.set("active", active ? "true" : "false");
    fd.set("featured", featured ? "true" : "false");
    fd.set("images", JSON.stringify(images));
    fd.set("stockType", stockType);

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

  return (
    <form onSubmit={onSubmit} className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/produkte">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? "Produkt bearbeiten" : "Neues Produkt"}</h1>
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
                <p className="text-xs text-muted-foreground">/produkte/{slug || "..."}</p>
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
            <CardHeader><CardTitle>Bilder</CardTitle></CardHeader>
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
                <UploadDropzone
                  endpoint="productImage"
                  config={{ mode: "auto" }}
                  appearance={{
                    container: "border-dashed border-2 rounded-md p-6 ut-uploading:opacity-50",
                    button: "bg-primary text-primary-foreground rounded-md text-sm",
                  }}
                  onClientUploadComplete={(res) => {
                    setImages((arr) => [
                      ...arr,
                      ...res.map((r) => ({ url: r.url, key: r.key, alt: name })),
                    ].slice(0, 10));
                    toast.success(`${res.length} Bild(er) hochgeladen`);
                  }}
                  onUploadError={(err) => { toast.error(`Upload fehlgeschlagen: ${err.message}`); }}
                />
              )}
              <p className="text-xs text-muted-foreground">Max. 10 Bilder, je 4 MB. Erstes Bild = Hauptbild.</p>
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
                <Label htmlFor="legoSetNumber">Lego Set-Nr.</Label>
                <Input id="legoSetNumber" name="legoSetNumber" defaultValue={product?.legoSetNumber ?? ""} placeholder="z.B. 75300" />
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
              <div className="space-y-2">
                <Label htmlFor="customShippingMethodId">Versandmethode erzwingen (optional)</Label>
                <Select name="customShippingMethodId" defaultValue={product?.customShippingMethodId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Automatisch (über Regeln)" /></SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
