"use client";

import { useState, useTransition } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type Variant = "soft" | "hard" | "restore";

const presets: Record<Variant, {
  triggerLabel: string;
  triggerVariant: "destructive" | "outline" | "default";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  confirmLabel: string;
}> = {
  soft: {
    triggerLabel: "In Papierkorb",
    triggerVariant: "destructive",
    icon: Trash2,
    title: "In Papierkorb verschieben?",
    description: "Der Eintrag wird in den Papierkorb verschoben und ist auf der Übersicht nicht mehr sichtbar. Du kannst ihn jederzeit wiederherstellen.",
    confirmLabel: "Ja, in Papierkorb",
  },
  hard: {
    triggerLabel: "Endgültig löschen",
    triggerVariant: "destructive",
    icon: AlertTriangle,
    title: "Endgültig löschen?",
    description: "Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Daten (inkl. Bilder) werden unwiderruflich entfernt.",
    confirmLabel: "Ja, endgültig löschen",
  },
  restore: {
    triggerLabel: "Wiederherstellen",
    triggerVariant: "outline",
    icon: RotateCcw,
    title: "Wiederherstellen?",
    description: "Der Eintrag wird aus dem Papierkorb geholt und erscheint wieder in der normalen Übersicht.",
    confirmLabel: "Ja, wiederherstellen",
  },
};

type Props = {
  variant: Variant;
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  triggerLabel?: string;
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
};

export function ConfirmActionButton({ variant, action, id, triggerLabel, size = "default", className }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const cfg = presets[variant];
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={cfg.triggerVariant} size={size} className={className}>
          <Icon className="h-4 w-4 mr-2" />
          {triggerLabel ?? cfg.triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cfg.title}</DialogTitle>
          <DialogDescription>{cfg.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>Abbrechen</Button>
          </DialogClose>
          <Button
            variant={variant === "restore" ? "default" : "destructive"}
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", id);
              startTransition(async () => {
                await action(fd);
                setOpen(false);
              });
            }}
          >
            {pending ? "Bitte warten…" : cfg.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
