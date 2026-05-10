import nodemailer, { type Transporter } from "nodemailer";
import { render } from "@react-email/render";
import * as React from "react";

// SMTP transport (Gmail by default). Configured via env:
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
//
// For Gmail you need an APP PASSWORD (Google Account → Security →
// 2-Step Verification → App passwords). The regular Google password
// will NOT work.

let cached: Transporter | null = null;
function getTransporter(): Transporter | null {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? "465");
  // Gmail recommends 465 + secure=true (SSL). Port 587 uses STARTTLS (secure=false).
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cached;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      "[email] SMTP nicht konfiguriert — Email wird nicht gesendet:",
      args.subject,
    );
    return { ok: false, reason: "no-smtp" };
  }

  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "slminifigs@gmail.com";
  const replyTo = args.replyTo ?? process.env.EMAIL_REPLY_TO;

  try {
    const html = await render(args.react);
    const text = await render(args.react, { plainText: true });
    const result = await transporter.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      html,
      text,
      replyTo,
    });
    return { ok: true, id: result.messageId };
  } catch (err) {
    console.error("[email] Exception:", err);
    return { ok: false, reason: "exception" };
  }
}

// ============================================================
// Templates (React Email)
// ============================================================

import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button as EmailButton,
  Hr,
  Section,
  Row,
  Column,
} from "@react-email/components";

const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "SL Minifigs";
const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";

const main = {
  backgroundColor: "#f6f6f7",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};
const container = {
  backgroundColor: "#fff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "12px",
};
const heading = { fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px" };
const para = { fontSize: "14px", color: "#334155", lineHeight: "22px" };
const btn = {
  backgroundColor: "#E3000B",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  display: "inline-block",
};
const footerStyle = { fontSize: "12px", color: "#94a3b8", marginTop: "24px" };

export function verifyEmailEmail({ name, verifyUrl }: { name: string; verifyUrl: string }) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Email bestätigen</Heading>
          <Text style={para}>Hallo {name || "und herzlich willkommen"}!</Text>
          <Text style={para}>
            Klicke auf den folgenden Link, um deine Email-Adresse zu bestätigen:
          </Text>
          <EmailButton href={verifyUrl} style={btn}>
            Email bestätigen
          </EmailButton>
          <Text style={footerStyle}>
            Falls du dich nicht bei {shopName} registriert hast, ignoriere diese Email einfach.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function passwordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Passwort zurücksetzen</Heading>
          <Text style={para}>Hallo {name || "dort"},</Text>
          <Text style={para}>
            Du hast eine Passwort-Zurücksetzung angefordert. Der Link ist 1 Stunde gültig:
          </Text>
          <EmailButton href={resetUrl} style={btn}>
            Passwort zurücksetzen
          </EmailButton>
          <Text style={footerStyle}>
            Falls du das nicht angefordert hast, ignoriere diese Email — dein Passwort bleibt unverändert.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; total: string }>;
  subtotal: string;
  shipping: string;
  total: string;
  shippingAddress: string;
  trackingUrl?: string;
  trackingNumber?: string;
  trackingProvider?: string;
}

export function orderConfirmationEmail(data: OrderEmailData) {
  const orderUrl = `${shopUrl}/bestellung/${data.orderNumber}`;
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Bestellung bestätigt</Heading>
          <Text style={para}>Hallo {data.customerName},</Text>
          <Text style={para}>
            vielen Dank für deine Bestellung bei {shopName}! Hier eine Zusammenfassung:
          </Text>
          <Section style={{ borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "16px 0", margin: "16px 0" }}>
            <Text style={{ ...para, fontWeight: 600, marginBottom: 8 }}>Bestell-Nr: {data.orderNumber}</Text>
            {data.items.map((item, i) => (
              <Row key={i} style={{ marginBottom: 4 }}>
                <Column style={para}>{item.quantity}× {item.name}</Column>
                <Column style={{ ...para, textAlign: "right" }}>{item.total}</Column>
              </Row>
            ))}
            <Hr style={{ borderColor: "#e2e8f0", margin: "8px 0" }} />
            <Row><Column style={para}>Zwischensumme</Column><Column style={{ ...para, textAlign: "right" }}>{data.subtotal}</Column></Row>
            <Row><Column style={para}>Versand</Column><Column style={{ ...para, textAlign: "right" }}>{data.shipping}</Column></Row>
            <Row><Column style={{ ...para, fontWeight: 700 }}>Gesamt</Column><Column style={{ ...para, fontWeight: 700, textAlign: "right" }}>{data.total}</Column></Row>
          </Section>
          <Text style={{ ...para, fontWeight: 600 }}>Lieferadresse</Text>
          <Text style={{ ...para, whiteSpace: "pre-line" }}>{data.shippingAddress}</Text>
          <EmailButton href={orderUrl} style={btn}>Bestellung ansehen</EmailButton>
          <Text style={footerStyle}>
            Bei Fragen einfach auf diese Email antworten — wir helfen gern.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function shippingNotificationEmail(data: OrderEmailData) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Deine Bestellung ist unterwegs</Heading>
          <Text style={para}>Hallo {data.customerName},</Text>
          <Text style={para}>
            wir haben deine Bestellung <strong>{data.orderNumber}</strong> gerade verschickt.
          </Text>
          {data.trackingNumber && (
            <Section style={{ borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "16px 0", margin: "16px 0" }}>
              <Text style={para}>
                <strong>Tracking-Nummer:</strong> {data.trackingNumber}
                {data.trackingProvider ? ` (${data.trackingProvider})` : ""}
              </Text>
              {data.trackingUrl && (
                <EmailButton href={data.trackingUrl} style={btn}>Sendung verfolgen</EmailButton>
              )}
            </Section>
          )}
          <Text style={para}>Lieferadresse:</Text>
          <Text style={{ ...para, whiteSpace: "pre-line" }}>{data.shippingAddress}</Text>
          <Text style={footerStyle}>
            Sobald das Paket bei dir ist, freuen wir uns über eine kurze Rückmeldung.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function contactNotificationEmail(data: { name: string; email: string; subject: string; message: string }) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Neue Kontaktanfrage</Heading>
          <Text style={para}><strong>Von:</strong> {data.name} ({data.email})</Text>
          <Text style={para}><strong>Betreff:</strong> {data.subject}</Text>
          <Hr style={{ borderColor: "#e2e8f0", margin: "16px 0" }} />
          <Text style={{ ...para, whiteSpace: "pre-line" }}>{data.message}</Text>
        </Container>
      </Body>
    </Html>
  );
}
