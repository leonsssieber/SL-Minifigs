import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const metadata = { title: "Export" };

export default function ExportPage() {
  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Export</h1>
        <p className="text-muted-foreground">Daten als CSV exportieren</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bestellungen</CardTitle>
          <CardDescription>Alle Bestellungen inklusive Adresse, Items, Status und Beträge.</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/api/admin/export/orders.csv">
            <Button className="gap-2"><Download className="h-4 w-4" />Bestellungen als CSV</Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produkte</CardTitle>
          <CardDescription>Alle Produkte inklusive Bestand, Preis und Kategorie.</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/api/admin/export/products.csv">
            <Button className="gap-2"><Download className="h-4 w-4" />Produkte als CSV</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
