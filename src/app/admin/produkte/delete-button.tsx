"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteProduct } from "@/server/actions/products";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function handleDelete() {
    start(async () => {
      const r = await deleteProduct(id);
      if (r.ok) {
        toast.success("Produkt gelöscht");
        setOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Produkt löschen?</DialogTitle>
          <DialogDescription>
            „{name}" wird gelöscht. Falls bereits Bestellungen existieren, wird das Produkt nur deaktiviert.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Wird gelöscht…" : "Löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
