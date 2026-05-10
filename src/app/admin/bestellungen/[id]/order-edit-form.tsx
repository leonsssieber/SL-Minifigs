"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateOrder } from "@/server/actions/orders";

interface Props {
  orderId: string;
  defaults: {
    status: string;
    trackingNumber: string | null;
    trackingProvider: string | null;
    trackingUrl: string | null;
    adminNotes: string | null;
  };
}

const STATUSES = [
  { value: "PENDING", label: "Offen" },
  { value: "PAID", label: "Bezahlt" },
  { value: "PROCESSING", label: "In Bearbeitung" },
  { value: "SHIPPED", label: "Versendet" },
  { value: "COMPLETED", label: "Abgeschlossen" },
  { value: "CANCELLED", label: "Storniert" },
  { value: "REFUNDED", label: "Rückerstattet" },
];

export function OrderEditForm({ orderId, defaults }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(defaults.status);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("status", status);
    start(async () => {
      const r = await updateOrder(orderId, fd);
      if (r.ok) { toast.success("Gespeichert"); router.refresh(); }
      else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trackingNumber">Tracking-Nr.</Label>
          <Input id="trackingNumber" name="trackingNumber" defaultValue={defaults.trackingNumber ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trackingProvider">Versanddienst</Label>
          <Input id="trackingProvider" name="trackingProvider" defaultValue={defaults.trackingProvider ?? "Schweizerische Post"} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trackingUrl">Tracking-URL</Label>
        <Input id="trackingUrl" name="trackingUrl" type="url" defaultValue={defaults.trackingUrl ?? ""} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminNotes">Interne Notizen</Label>
        <Textarea id="adminNotes" name="adminNotes" rows={3} defaultValue={defaults.adminNotes ?? ""} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Wird gespeichert…" : "Speichern"}
      </Button>
    </form>
  );
}
