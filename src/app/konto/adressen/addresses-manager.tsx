"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { createAddress, updateAddress, deleteAddress } from "@/server/actions/addresses";

interface Address {
  id: string;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company: string | null;
  street: string;
  street2: string | null;
  zip: string;
  city: string;
  country: string;
  phone: string | null;
}

export function AddressesManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Neue Adresse
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Noch keine Adresse gespeichert.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                {a.isDefault && <Badge variant="success">Standard</Badge>}
                <div className="flex gap-1 ml-auto">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(a)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <DeleteAddrButton
                    onConfirm={async () => {
                      const r = await deleteAddress(a.id);
                      if (r.ok) { toast.success("Gelöscht"); router.refresh(); }
                      else toast.error(r.error);
                    }}
                  />
                </div>
              </div>
              <div className="text-sm whitespace-pre-line">
                {[
                  `${a.firstName} ${a.lastName}`,
                  a.company,
                  a.street,
                  a.street2,
                  `${a.zip} ${a.city}`,
                  a.country,
                  a.phone,
                ].filter(Boolean).join("\n")}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddressDialog open={creating} onOpenChange={setCreating} onDone={() => router.refresh()} />
      {editing && (
        <AddressDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          address={editing}
          onDone={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function AddressDialog({
  open, onOpenChange, address, onDone,
}: { open: boolean; onOpenChange: (o: boolean) => void; address?: Address; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("isDefault", isDefault ? "true" : "false");
    start(async () => {
      const r = address ? await updateAddress(address.id, fd) : await createAddress(fd);
      if (r.ok) { toast.success("Gespeichert"); onDone(); }
      else toast.error(r.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? "Adresse bearbeiten" : "Neue Adresse"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Vorname *</Label><Input name="firstName" required defaultValue={address?.firstName ?? ""} /></div>
            <div className="space-y-2"><Label>Nachname *</Label><Input name="lastName" required defaultValue={address?.lastName ?? ""} /></div>
          </div>
          <div className="space-y-2"><Label>Firma</Label><Input name="company" defaultValue={address?.company ?? ""} /></div>
          <div className="space-y-2"><Label>Strasse *</Label><Input name="street" required defaultValue={address?.street ?? ""} /></div>
          <div className="space-y-2"><Label>Adresszusatz</Label><Input name="street2" defaultValue={address?.street2 ?? ""} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>PLZ *</Label><Input name="zip" required defaultValue={address?.zip ?? ""} /></div>
            <div className="space-y-2 col-span-2"><Label>Ort *</Label><Input name="city" required defaultValue={address?.city ?? ""} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Land</Label>
              <select name="country" defaultValue={address?.country ?? "CH"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="CH">Schweiz</option>
                <option value="LI">Liechtenstein</option>
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="FR">Frankreich</option>
                <option value="IT">Italien</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Telefon</Label><Input name="phone" defaultValue={address?.phone ?? ""} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
            Als Standardadresse setzen
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending}>{pending ? "..." : "Speichern"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAddrButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-3 w-3" />
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Adresse löschen?</DialogTitle></DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="destructive" disabled={pending} onClick={() => start(async () => { await onConfirm(); setOpen(false); })}>Löschen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
