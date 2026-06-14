"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCondition,
  updateCondition,
  deleteCondition,
  seedDefaultConditions,
} from "@/server/actions/conditions";

interface ConditionRow {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
  inUse: number;
}

export function ConditionsManager({ conditions }: { conditions: ConditionRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newLabel, setNewLabel] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Fehler");
      }
    });
  }

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    const fd = new FormData();
    fd.set("label", label);
    fd.set("sortOrder", String(conditions.length));
    run(() => createCondition(fd), "Zustand hinzugefügt");
    setNewLabel("");
  }

  function onSaveRow(row: ConditionRow, label: string, sortOrder: string, active: boolean) {
    const fd = new FormData();
    fd.set("label", label);
    fd.set("sortOrder", sortOrder);
    fd.set("active", active ? "true" : "false");
    run(() => updateCondition(row.id, fd), "Gespeichert");
  }

  return (
    <div className="space-y-6">
      {conditions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Noch keine Zustände angelegt. Aktuell gelten die eingebauten Standard-Zustände.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => run(seedDefaultConditions, "Standard-Zustände angelegt")}
            >
              Standard-Zustände übernehmen
            </Button>
          </CardContent>
        </Card>
      )}

      {conditions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Vorhandene Zustände</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {conditions.map((row) => (
              <ConditionRowForm
                key={row.id}
                row={row}
                pending={pending}
                onSave={onSaveRow}
                onDelete={() => run(() => deleteCondition(row.id), "Gelöscht")}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Neuer Zustand</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="z.B. Defekt / Bastlerstück"
              maxLength={60}
              className="flex-1"
            />
            <Button type="submit" disabled={pending || !newLabel.trim()} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" /> Hinzufügen
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Der interne Code wird automatisch aus der Bezeichnung erzeugt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ConditionRowForm({
  row,
  pending,
  onSave,
  onDelete,
}: {
  row: ConditionRow;
  pending: boolean;
  onSave: (row: ConditionRow, label: string, sortOrder: string, active: boolean) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(row.label);
  const [sortOrder, setSortOrder] = useState(String(row.sortOrder));
  const [active, setActive] = useState(row.active);
  const dirty = label !== row.label || sortOrder !== String(row.sortOrder) || active !== row.active;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-2.5">
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={60}
        className="flex-1 min-w-[140px]"
      />
      <Input
        type="number"
        min={0}
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="w-16"
        title="Reihenfolge"
      />
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
        aktiv
      </label>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending || !dirty}
        onClick={() => onSave(row, label, sortOrder, active)}
      >
        Speichern
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending || row.inUse > 0}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
        title={row.inUse > 0 ? `Wird von ${row.inUse} Produkt(en) verwendet` : "Löschen"}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {row.inUse > 0 && (
        <span className="w-full text-[11px] text-muted-foreground sm:pl-6">
          Code: <span className="font-mono">{row.value}</span> · von {row.inUse} Produkt(en) verwendet
        </span>
      )}
    </div>
  );
}
