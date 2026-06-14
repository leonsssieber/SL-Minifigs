import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCHF, decimalToNumber } from "@/lib/utils";
import { getProductConditions } from "@/lib/conditions";
import { DeleteProductButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, conditions] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    getProductConditions(),
  ]);
  const conditionLabels = new Map(conditions.map((c) => [c.value, c.label]));

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Produkte</h1>
          <p className="text-muted-foreground">{products.length} Produkte insgesamt</p>
        </div>
        <Link href="/admin/produkte/neu">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Produkt anlegen
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Noch keine Produkte. <Link href="/admin/produkte/neu" className="text-primary hover:underline">Erstes Produkt anlegen →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left bg-muted/50">
                <tr>
                  <th className="py-3 px-4 font-medium w-16"></th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Kategorie</th>
                  <th className="py-3 px-4 font-medium">Zustand</th>
                  <th className="py-3 px-4 font-medium text-right">Preis</th>
                  <th className="py-3 px-4 font-medium text-right">Bestand</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium w-32"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="py-2 px-4">
                      {p.images[0] ? (
                        <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted">
                          <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted" />
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <Link href={`/admin/produkte/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                      {p.featured && <Badge variant="warning" className="ml-2 text-[10px]">★ Featured</Badge>}
                      <div className="text-xs text-muted-foreground font-mono">{p.slug}</div>
                    </td>
                    <td className="py-2 px-4 text-muted-foreground">{p.category.name}</td>
                    <td className="py-2 px-4 text-muted-foreground">
                      {conditionLabels.get(p.condition) ?? p.condition}
                      {p.incomplete && <span className="ml-1 text-amber-600">· Unvollständig</span>}
                    </td>
                    <td className="py-2 px-4 text-right font-medium">{formatCHF(decimalToNumber(p.price))}</td>
                    <td className="py-2 px-4 text-right">{p.stockQuantity}</td>
                    <td className="py-2 px-4">
                      {p.active ? (
                        p.stockQuantity > 0 ? <Badge variant="success">Aktiv</Badge> : <Badge variant="warning">Ausverkauft</Badge>
                      ) : (
                        <Badge variant="secondary">Inaktiv</Badge>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/produkte/${p.id}`}>
                          <Button variant="outline" size="sm">Bearbeiten</Button>
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
