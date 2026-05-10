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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createShippingMethod, updateShippingMethod, deleteShippingMethod,
  createShippingRule, updateShippingRule, deleteShippingRule,
} from "@/server/actions/shipping";
import { formatCHF } from "@/lib/utils";

interface Method {
  id: string; name: string; description: string | null;
  basePrice: number; active: boolean; sortOrder: number;
}
interface Rule {
  id: string; name: string; methodId: string; priority: number; active: boolean;
  minMinifigures: number | null; maxMinifigures: number | null;
  minSets: number | null; maxSets: number | null;
  minItems: number | null; maxItems: number | null;
  minOrderValue: number | null; maxOrderValue: number | null;
  minWeightGrams: number | null; maxWeightGrams: number | null;
  fixedPrice: number | null; perItemSurcharge: number | null;
}

export function ShippingManager({ methods, rules }: { methods: Method[]; rules: Rule[] }) {
  const router = useRouter();
  const [editingMethod, setEditingMethod] = useState<Method | null>(null);
  const [creatingMethod, setCreatingMethod] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [creatingRule, setCreatingRule] = useState(false);

  const methodById = (id: string) => methods.find((m) => m.id === id);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Versandmethoden</CardTitle>
          <Button size="sm" className="gap-2" onClick={() => setCreatingMethod(true)}>
            <Plus className="h-4 w-4" /> Methode
          </Button>
        </CardHeader>
        <CardContent>
          {methods.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Noch keine Methoden. Lege z.B. „B-Post Brief" mit CHF 1.40 an.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left bg-muted/50">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium text-right">Basispreis</th>
                  <th className="px-4 py-2 font-medium text-right">Reihenfolge</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="font-medium">{m.name}</div>
                      {m.description && <div className="text-xs text-muted-foreground">{m.description}</div>}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{formatCHF(m.basePrice)}</td>
                    <td className="px-4 py-2 text-right">{m.sortOrder}</td>
                    <td className="px-4 py-2">{m.active ? <Badge variant="success">Aktiv</Badge> : <Badge variant="secondary">Inaktiv</Badge>}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingMethod(m)}><Pencil className="h-3 w-3" /></Button>
                        <DeleteButton
                          onConfirm={async () => {
                            const r = await deleteShippingMethod(m.id);
                            if (r.ok) { toast.success("Gelöscht"); router.refresh(); }
                            else toast.error(r.error);
                          }}
                          label={`Methode „${m.name}" löschen?`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Versandregeln</CardTitle>
          <Button size="sm" className="gap-2" onClick={() => setCreatingRule(true)} disabled={methods.length === 0}>
            <Plus className="h-4 w-4" /> Regel
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Regeln werden nach Priorität geprüft (höher = zuerst). Die erste Regel mit zutreffenden
            Bedingungen wird verwendet. Methode ohne Regeln gilt als „immer verfügbar".
          </p>
          {rules.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Noch keine Regeln. Beispiel: „bis 20 Minifiguren → Brief".
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left bg-muted/50">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Methode</th>
                  <th className="px-4 py-2 font-medium">Bedingungen</th>
                  <th className="px-4 py-2 font-medium text-right">Priorität</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2">{methodById(r.methodId)?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {ruleSummary(r)}
                    </td>
                    <td className="px-4 py-2 text-right">{r.priority}</td>
                    <td className="px-4 py-2">{r.active ? <Badge variant="success">Aktiv</Badge> : <Badge variant="secondary">Inaktiv</Badge>}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingRule(r)}><Pencil className="h-3 w-3" /></Button>
                        <DeleteButton
                          onConfirm={async () => {
                            const result = await deleteShippingRule(r.id);
                            if (result.ok) { toast.success("Gelöscht"); router.refresh(); }
                            else toast.error(result.error);
                          }}
                          label={`Regel „${r.name}" löschen?`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <MethodDialog open={creatingMethod} onOpenChange={setCreatingMethod} onDone={() => router.refresh()} />
      {editingMethod && (
        <MethodDialog
          open={!!editingMethod}
          onOpenChange={(o) => !o && setEditingMethod(null)}
          method={editingMethod}
          onDone={() => { setEditingMethod(null); router.refresh(); }}
        />
      )}
      <RuleDialog
        open={creatingRule}
        onOpenChange={setCreatingRule}
        methods={methods}
        onDone={() => router.refresh()}
      />
      {editingRule && (
        <RuleDialog
          open={!!editingRule}
          onOpenChange={(o) => !o && setEditingRule(null)}
          rule={editingRule}
          methods={methods}
          onDone={() => { setEditingRule(null); router.refresh(); }}
        />
      )}
    </>
  );
}

function ruleSummary(r: Rule): string {
  const parts: string[] = [];
  if (r.minMinifigures != null || r.maxMinifigures != null)
    parts.push(`Minifig: ${r.minMinifigures ?? 0}–${r.maxMinifigures ?? "∞"}`);
  if (r.minSets != null || r.maxSets != null)
    parts.push(`Sets: ${r.minSets ?? 0}–${r.maxSets ?? "∞"}`);
  if (r.minItems != null || r.maxItems != null)
    parts.push(`Items: ${r.minItems ?? 0}–${r.maxItems ?? "∞"}`);
  if (r.minWeightGrams != null || r.maxWeightGrams != null)
    parts.push(`Gewicht: ${r.minWeightGrams ?? 0}–${r.maxWeightGrams ?? "∞"}g`);
  if (r.minOrderValue != null || r.maxOrderValue != null)
    parts.push(`Wert: CHF ${r.minOrderValue ?? 0}–${r.maxOrderValue ?? "∞"}`);
  return parts.length > 0 ? parts.join(" · ") : "Immer (keine Bedingungen)";
}

function MethodDialog({
  open, onOpenChange, method, onDone,
}: { open: boolean; onOpenChange: (o: boolean) => void; method?: Method; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [active, setActive] = useState(method?.active ?? true);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("active", active ? "true" : "false");
    start(async () => {
      const r = method ? await updateShippingMethod(method.id, fd) : await createShippingMethod(fd);
      if (r.ok) { toast.success("Gespeichert"); onDone(); }
      else toast.error(r.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{method ? "Methode bearbeiten" : "Neue Methode"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input name="name" required defaultValue={method?.name ?? ""} placeholder="z.B. B-Post Brief" />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea name="description" defaultValue={method?.description ?? ""} rows={2} placeholder="Zustelldauer, etc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Basispreis (CHF) *</Label>
              <Input name="basePrice" type="number" step="0.05" min="0" required defaultValue={method?.basePrice ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Reihenfolge</Label>
              <Input name="sortOrder" type="number" min="0" defaultValue={method?.sortOrder ?? 0} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Aktiv</Label>
            <Switch checked={active} onCheckedChange={setActive} />
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

function RuleDialog({
  open, onOpenChange, rule, methods, onDone,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  rule?: Rule; methods: Method[]; onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [active, setActive] = useState(rule?.active ?? true);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("active", active ? "true" : "false");
    start(async () => {
      const r = rule ? await updateShippingRule(rule.id, fd) : await createShippingRule(fd);
      if (r.ok) { toast.success("Gespeichert"); onDone(); }
      else toast.error(r.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Regel bearbeiten" : "Neue Regel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input name="name" required defaultValue={rule?.name ?? ""} placeholder="z.B. Brief-Regel" />
            </div>
            <div className="space-y-2">
              <Label>Methode *</Label>
              <Select name="methodId" defaultValue={rule?.methodId} required>
                <SelectTrigger><SelectValue placeholder="Wähle..." /></SelectTrigger>
                <SelectContent>
                  {methods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priorität</Label>
              <Input name="priority" type="number" min="0" defaultValue={rule?.priority ?? 100} />
              <p className="text-xs text-muted-foreground">Höher = zuerst geprüft</p>
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Aktiv</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>

          <fieldset className="border rounded-md p-4 space-y-3">
            <legend className="px-2 text-sm font-medium">Bedingungen (alle leer = immer)</legend>
            {[
              { key: "Minifigures", label: "Minifiguren" },
              { key: "Sets", label: "Sets" },
              { key: "Items", label: "Total Items" },
              { key: "WeightGrams", label: "Gewicht (g)" },
              { key: "OrderValue", label: "Bestellwert (CHF)", step: "0.05" },
            ].map((c) => (
              <div key={c.key} className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min. {c.label}</Label>
                  <Input
                    name={`min${c.key}`}
                    type="number"
                    step={c.step ?? "1"}
                    min="0"
                    defaultValue={(rule as Record<string, unknown> | undefined)?.[`min${c.key}`] as string ?? ""}
                  />
                </div>
                <div>
                  <Label className="text-xs">Max. {c.label}</Label>
                  <Input
                    name={`max${c.key}`}
                    type="number"
                    step={c.step ?? "1"}
                    min="0"
                    defaultValue={(rule as Record<string, unknown> | undefined)?.[`max${c.key}`] as string ?? ""}
                  />
                </div>
              </div>
            ))}
          </fieldset>

          <fieldset className="border rounded-md p-4 space-y-3">
            <legend className="px-2 text-sm font-medium">Preis (optional)</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Fixer Preis (CHF)</Label>
                <Input name="fixedPrice" type="number" step="0.05" min="0" defaultValue={rule?.fixedPrice ?? ""} placeholder="leer = Basispreis" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Aufschlag pro Item (CHF)</Label>
                <Input name="perItemSurcharge" type="number" step="0.05" min="0" defaultValue={rule?.perItemSurcharge ?? ""} placeholder="leer = 0" />
              </div>
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending}>{pending ? "..." : "Speichern"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({ onConfirm, label }: { onConfirm: () => Promise<void>; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-3 w-3" />
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => start(async () => { await onConfirm(); setOpen(false); })}
          >Löschen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
