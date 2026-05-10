import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from "@react-pdf/renderer";
import { formatCHF, formatDate, decimalToNumber } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  shopName: { fontSize: 22, fontWeight: "bold" },
  shopMeta: { fontSize: 9, color: "#666", marginTop: 4 },
  invoiceTitle: { fontSize: 16, fontWeight: "bold", textAlign: "right" },
  invoiceMeta: { fontSize: 9, color: "#666", textAlign: "right" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  twoCol: { flexDirection: "row", gap: 24, marginBottom: 16 },
  col: { flex: 1 },
  table: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 6, fontWeight: "bold" },
  tableRow: { flexDirection: "row", padding: 6, borderTopWidth: 1, borderColor: "#e2e8f0" },
  cellName: { flex: 3 },
  cellQty: { flex: 1, textAlign: "right" },
  cellPrice: { flex: 1.5, textAlign: "right" },
  cellTotal: { flex: 1.5, textAlign: "right" },
  totals: { marginTop: 12, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", gap: 12 },
  totalLabel: { width: 120, textAlign: "right", color: "#666" },
  totalValue: { width: 80, textAlign: "right", fontWeight: "bold" },
  grandTotal: { fontSize: 12, marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderColor: "#e2e8f0" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#94a3b8" },
});

interface InvoiceData {
  shopName: string;
  shopAddress?: string;
  shopEmail?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerAddress: string[];
  customerEmail?: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  shipping: number;
  shippingMethodName: string;
  total: number;
  paymentProvider?: string;
  notes?: string;
}

function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{data.shopName}</Text>
            {data.shopAddress && <Text style={styles.shopMeta}>{data.shopAddress}</Text>}
            {data.shopEmail && <Text style={styles.shopMeta}>{data.shopEmail}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Rechnung</Text>
            <Text style={styles.invoiceMeta}>Nr. {data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>Datum: {formatDate(data.invoiceDate)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Rechnungsadresse</Text>
            <Text>{data.customerName}</Text>
            {data.customerAddress.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
            {data.customerEmail && <Text style={styles.shopMeta}>{data.customerEmail}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Versand</Text>
            <Text>{data.shippingMethodName}</Text>
            {data.paymentProvider && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Bezahlmethode</Text>
                <Text>{data.paymentProvider}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellName}>Artikel</Text>
            <Text style={styles.cellQty}>Menge</Text>
            <Text style={styles.cellPrice}>Einzelpreis</Text>
            <Text style={styles.cellTotal}>Gesamt</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.cellName}>{it.name}</Text>
              <Text style={styles.cellQty}>{it.quantity}</Text>
              <Text style={styles.cellPrice}>{formatCHF(it.unitPrice)}</Text>
              <Text style={styles.cellTotal}>{formatCHF(it.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Zwischensumme</Text>
            <Text style={styles.totalValue}>{formatCHF(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Versand</Text>
            <Text style={styles.totalValue}>{formatCHF(data.shipping)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Gesamtbetrag</Text>
            <Text style={styles.totalValue}>{formatCHF(data.total)}</Text>
          </View>
        </View>

        {data.notes && (
          <View style={[styles.section, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Anmerkungen</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Vielen Dank für deine Bestellung! · {data.shopName}
        </Text>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(orderId: string, db: typeof import("@/lib/db").db): Promise<Buffer | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { email: true } } },
  });
  if (!order) return null;

  const data: InvoiceData = {
    shopName: process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs",
    shopAddress: undefined, // optional aus SiteSetting
    shopEmail: process.env.EMAIL_REPLY_TO,
    invoiceNumber: order.orderNumber,
    invoiceDate: order.createdAt,
    customerName: `${order.shippingFirstName} ${order.shippingLastName}`,
    customerAddress: [
      order.shippingCompany,
      order.shippingStreet,
      order.shippingStreet2,
      `${order.shippingZip} ${order.shippingCity}`,
      order.shippingCountry,
    ].filter((x): x is string => !!x),
    customerEmail: order.user?.email ?? order.guestEmail ?? undefined,
    items: order.items.map((it) => ({
      name: it.productName,
      quantity: it.quantity,
      unitPrice: decimalToNumber(it.unitPrice),
      total: decimalToNumber(it.lineTotal),
    })),
    subtotal: decimalToNumber(order.subtotal),
    shipping: decimalToNumber(order.shippingCost),
    shippingMethodName: order.shippingMethodName,
    total: decimalToNumber(order.total),
    paymentProvider: order.paymentProvider,
  };

  return await renderToBuffer(<InvoicePDF data={data} />);
}
