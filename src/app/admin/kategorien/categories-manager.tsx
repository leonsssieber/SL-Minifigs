"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { createCategory, updateCategory, deleteCategory } from "@/server/actions/categories";
import { slugify } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Neue Kategorie
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Noch keine Kategorien.
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium text-right">Reihenfolge</th>
                <th className="px-4 py-3 font-medium text-right">Produkte</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-32"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{c.slug}</td>
                  <td className="px-4 py-3 text-right">{c.sortOrder}</td>
                  <td className="px-4 py-3 text-right">{c.productCount}</td>
                  <td className="px-4 py-3">
                    {c.active ? <Badge variant="success">Aktiv</Badge> : <Badge variant="secondary">Inaktiv</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(c)}><Pencil className="h-3 w-3" /></Button>
                      <DeleteButton category={c} onDone={() => router.refresh()} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => router.refresh()}
      />
      {editing && (
        <CategoryDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          category={editing}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </>
  );
}

function CategoryDialog({
  open, onOpenChange, category, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category?: Category;
  onSaved: () => void;
}) {
  const [pending, start] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!category?.slug);
  const [active, setActive] = useState(category?.active ?? true);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("active", active ? "true" : "false");
    start(async () => {
      const result = category
        ? await updateCategory(category.id, fd)
        : await createCategory(fd);
      if (result.ok) {
        toast.success(category ? "Gespeichert" : "Angelegt");
        onSaved();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              name="name" required value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input
              name="slug" required value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
            />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea name="description" defaultValue={category?.description ?? ""} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reihenfolge</Label>
              <Input name="sortOrder" type="number" min="0" defaultValue={category?.sortOrder ?? 0} />
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Aktiv</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending}>{pending ? "..." : "Speichern"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({ category, onDone }: { category: Category; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategorie „{category.name}" löschen?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {category.productCount > 0
            ? `Diese Kategorie hat ${category.productCount} Produkte und kann nicht gelöscht werden.`
            : "Diese Aktion ist permanent."}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button
            variant="destructive"
            disabled={pending || category.productCount > 0}
            onClick={() => start(async () => {
              const r = await deleteCategory(category.id);
              if (r.ok) { toast.success("Gelöscht"); setOpen(false); onDone(); }
              else toast.error(r.error);
            })}
          >Löschen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
