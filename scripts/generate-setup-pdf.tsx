import {
  Document, Page, Text, View, StyleSheet, renderToFile, Link,
} from "@react-pdf/renderer";
import * as React from "react";
import * as path from "node:path";

const c = {
  red: "#E3000B",
  yellow: "#FFD500",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#ffffff",
  code: "#f1f5f9",
  warn: "#fef3c7",
  warnInk: "#854d0e",
  ok: "#dcfce7",
  okInk: "#166534",
};

const s = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10.5,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
    color: c.ink,
  },
  cover: {
    padding: 50,
    paddingTop: 90,
    backgroundColor: c.bg,
  },
  brand: {
    width: 56, height: 56,
    backgroundColor: c.red,
    color: "#fff",
    textAlign: "center",
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    paddingTop: 8,
    borderRadius: 10,
    marginBottom: 30,
  },
  title: { fontSize: 32, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  subtitle: { fontSize: 14, color: c.muted, marginBottom: 36 },
  meta: { fontSize: 9, color: c.muted, marginTop: 200 },

  h1: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: c.red,
  },
  h2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
  },
  p: { marginBottom: 6 },
  small: { fontSize: 9, color: c.muted },
  bullet: { flexDirection: "row", marginBottom: 4, paddingLeft: 4 },
  bulletDot: { width: 10, fontFamily: "Helvetica-Bold", color: c.red },
  step: {
    flexDirection: "row",
    marginBottom: 14,
  },
  stepNum: {
    width: 28, height: 28,
    backgroundColor: c.red,
    color: "#fff",
    borderRadius: 14,
    textAlign: "center",
    paddingTop: 7,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginRight: 10,
  },
  stepBody: { flex: 1, paddingTop: 4 },
  stepTitle: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 4 },
  code: {
    backgroundColor: c.code,
    padding: 8,
    fontFamily: "Courier",
    fontSize: 9.5,
    borderRadius: 4,
    marginVertical: 4,
  },
  warn: {
    backgroundColor: c.warn,
    color: c.warnInk,
    padding: 10,
    borderRadius: 4,
    marginVertical: 6,
    fontSize: 9.5,
    borderLeftWidth: 3,
    borderLeftColor: c.warnInk,
  },
  ok: {
    backgroundColor: c.ok,
    color: c.okInk,
    padding: 10,
    borderRadius: 4,
    marginVertical: 6,
    fontSize: 9.5,
    borderLeftWidth: 3,
    borderLeftColor: c.okInk,
  },
  table: {
    borderWidth: 1, borderColor: c.border, borderRadius: 4,
    marginVertical: 6,
  },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: c.border },
  trFirst: { flexDirection: "row" },
  th: { backgroundColor: c.code, padding: 6, fontFamily: "Helvetica-Bold", fontSize: 9 },
  td: { padding: 6, fontSize: 9 },
  link: { color: c.red, textDecoration: "underline" },
  pageNum: {
    position: "absolute",
    bottom: 28, right: 50,
    fontSize: 8, color: c.muted,
  },
  footer: {
    position: "absolute",
    bottom: 28, left: 50,
    fontSize: 8, color: c.muted,
  },
});

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={s.bullet}>
    <Text style={s.bulletDot}>•</Text>
    <Text style={{ flex: 1 }}>{children}</Text>
  </View>
);

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <View style={s.step} wrap={false}>
    <Text style={s.stepNum}>{n}</Text>
    <View style={s.stepBody}>
      <Text style={s.stepTitle}>{title}</Text>
      {children}
    </View>
  </View>
);

const PageFooter = () => (
  <>
    <Text style={s.footer}>Leon's Lego Shop · Setup-Anleitung</Text>
    <Text
      style={s.pageNum}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      fixed
    />
  </>
);

const Doc = () => (
  <Document
    title="Lego-Shop Setup-Anleitung"
    author="Leon's Lego Shop"
    subject="Schritt-für-Schritt Anleitung zur Inbetriebnahme"
  >
    {/* COVER */}
    <Page size="A4" style={s.cover}>
      <Text style={s.brand}>L</Text>
      <Text style={s.title}>Setup-Anleitung</Text>
      <Text style={s.subtitle}>Wie du deinen Lego-Shop in Betrieb nimmst</Text>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>Inhalt</Text>
        <Bullet>Voraussetzungen &amp; was du brauchst</Bullet>
        <Bullet>Externe Dienste registrieren (Stripe, PayPal, Resend, UploadThing, DB)</Bullet>
        <Bullet>Konfiguration (.env ausfüllen)</Bullet>
        <Bullet>Installation &amp; lokal starten</Bullet>
        <Bullet>Erste Schritte im Admin</Bullet>
        <Bullet>Versand-Engine konfigurieren</Bullet>
        <Bullet>Webhook-URLs für Bezahlung</Bullet>
        <Bullet>Online stellen (Deployment)</Bullet>
        <Bullet>Was du selbst noch tun musst</Bullet>
        <Bullet>Wichtige Befehle &amp; Troubleshooting</Bullet>
      </View>

      <Text style={s.meta}>
        Stand: {new Date().toLocaleDateString("de-CH")} · Generiert für deinen Shop.
      </Text>
    </Page>

    {/* PAGE 1: Voraussetzungen */}
    <Page size="A4" style={s.page}>
      <Text style={s.h1}>1. Voraussetzungen</Text>
      <Text style={s.p}>
        Bevor du loslegst, brauchst du auf deinem Mac folgendes installiert. Falls etwas fehlt,
        installiere es zuerst.
      </Text>

      <Text style={s.h2}>Software auf deinem Computer</Text>
      <Bullet>
        <Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Node.js</Text> (Version 20 oder neuer) — runterladen von{" "}
          <Link src="https://nodejs.org" style={s.link}>nodejs.org</Link>. Die LTS-Version ist okay.
        </Text>
      </Bullet>
      <Bullet>
        <Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Ein Code-Editor</Text> — z.B. VS Code von{" "}
          <Link src="https://code.visualstudio.com" style={s.link}>code.visualstudio.com</Link>.
          Brauchst du, um die <Text style={{ fontFamily: "Courier" }}>.env</Text>-Datei zu bearbeiten.
        </Text>
      </Bullet>
      <Bullet>
        <Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Terminal</Text> — schon eingebaut auf dem Mac
          (Spotlight → "Terminal" suchen).
        </Text>
      </Bullet>

      <Text style={s.h2}>Test ob alles da ist</Text>
      <Text style={s.p}>Öffne Terminal und tippe:</Text>
      <Text style={s.code}>{`node --version
npm --version`}</Text>
      <Text style={s.p}>Wenn beide eine Versionsnummer ausgeben, bist du bereit.</Text>

      <View style={s.ok}>
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>✓ Tipp</Text>
        <Text>
          Wenn du diese Setup-Anleitung liest, ist Node.js höchstwahrscheinlich schon installiert —
          dein Shop läuft ja bereits lokal mit SQLite. Du kannst diesen Schritt überspringen
          und bei Schritt 2 einsteigen.
        </Text>
      </View>

      <Text style={s.h1}>2. Was du holen musst (Accounts)</Text>
      <Text style={s.p}>
        Für den produktiven Betrieb brauchst du Accounts bei diesen Diensten. Alle haben einen
        Gratis-Tier, der zum Starten reicht.
      </Text>

      <View style={s.table}>
        <View style={s.trFirst}>
          <Text style={[s.th, { width: "25%" }]}>Dienst</Text>
          <Text style={[s.th, { width: "30%" }]}>Wofür</Text>
          <Text style={[s.th, { width: "45%" }]}>Wo registrieren</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "25%", fontFamily: "Helvetica-Bold" }]}>Datenbank</Text>
          <Text style={[s.td, { width: "30%" }]}>Speichert Produkte, Bestellungen, Kunden</Text>
          <Text style={[s.td, { width: "45%" }]}>
            <Link src="https://neon.tech" style={s.link}>neon.tech</Link> (gratis, am einfachsten)
          </Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "25%", fontFamily: "Helvetica-Bold" }]}>Stripe</Text>
          <Text style={[s.td, { width: "30%" }]}>Kreditkarten-Bezahlung</Text>
          <Text style={[s.td, { width: "45%" }]}>
            <Link src="https://dashboard.stripe.com/register" style={s.link}>dashboard.stripe.com</Link>
          </Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "25%", fontFamily: "Helvetica-Bold" }]}>PayPal Developer</Text>
          <Text style={[s.td, { width: "30%" }]}>PayPal-Bezahlung</Text>
          <Text style={[s.td, { width: "45%" }]}>
            <Link src="https://developer.paypal.com" style={s.link}>developer.paypal.com</Link>
          </Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "25%", fontFamily: "Helvetica-Bold" }]}>Resend</Text>
          <Text style={[s.td, { width: "30%" }]}>Emails (Bestätigung, Versand-Update)</Text>
          <Text style={[s.td, { width: "45%" }]}>
            <Link src="https://resend.com" style={s.link}>resend.com</Link> (3000 Mails/Monat gratis)
          </Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "25%", fontFamily: "Helvetica-Bold" }]}>UploadThing</Text>
          <Text style={[s.td, { width: "30%" }]}>Produkt-Bilder hochladen</Text>
          <Text style={[s.td, { width: "45%" }]}>
            <Link src="https://uploadthing.com" style={s.link}>uploadthing.com</Link> (2 GB gratis)
          </Text>
        </View>
      </View>

      <View style={s.warn}>
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>⚠ Wichtig</Text>
        <Text>
          Bei Stripe und PayPal: Erst im <Text style={{ fontFamily: "Helvetica-Bold" }}>Test-/Sandbox-Modus</Text>
          {" "}arbeiten und alles prüfen. Live-Keys erst eintragen, wenn alles funktioniert.
        </Text>
      </View>

      <PageFooter />
    </Page>

    {/* PAGE 2: Datenbank Setup */}
    <Page size="A4" style={s.page}>
      <Text style={s.h1}>3. Datenbank einrichten (Neon — empfohlen)</Text>
      <Text style={s.p}>
        Neon ist eine gehostete Postgres-Datenbank. Gratis, kein Setup, läuft sofort.
      </Text>

      <Step n={1} title="Account erstellen">
        <Text style={s.p}>Gehe auf neon.tech und registriere dich (mit Google/GitHub geht am schnellsten).</Text>
      </Step>
      <Step n={2} title="Neues Projekt anlegen">
        <Text style={s.p}>
          Klick auf "Create Project". Region: <Text style={{ fontFamily: "Helvetica-Bold" }}>Europe (Frankfurt)</Text>
          {" "}wählen — am nächsten zur Schweiz.
        </Text>
      </Step>
      <Step n={3} title="Connection-String kopieren">
        <Text style={s.p}>
          Im Dashboard siehst du den "Connection String". Sieht so aus:
        </Text>
        <Text style={s.code}>postgresql://user:passwort@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require</Text>
        <Text style={s.p}>Den brauchst du gleich für die <Text style={{ fontFamily: "Courier" }}>.env</Text>.</Text>
      </Step>

      <Text style={s.h1}>4. Stripe-Keys holen</Text>
      <Step n={1} title="Account erstellen + Land auf 'Schweiz' setzen">
        <Text style={s.p}>
          Auf dashboard.stripe.com registrieren, Geschäftsdaten ausfüllen.
        </Text>
      </Step>
      <Step n={2} title="API-Keys finden">
        <Text style={s.p}>
          Im Dashboard links: <Text style={{ fontFamily: "Courier" }}>Developers → API keys</Text>.
          Kopiere den <Text style={{ fontFamily: "Helvetica-Bold" }}>Publishable key</Text> (beginnt mit pk_test_)
          und den <Text style={{ fontFamily: "Helvetica-Bold" }}>Secret key</Text> (beginnt mit sk_test_).
        </Text>
      </Step>
      <Step n={3} title="Webhook-URL eintragen (kommt später)">
        <Text style={s.p}>
          Unter <Text style={{ fontFamily: "Courier" }}>Developers → Webhooks</Text> später einen Endpunkt
          anlegen mit URL: <Text style={{ fontFamily: "Courier" }}>https://DEINEDOMAIN.ch/api/webhooks/stripe</Text>.
          Events: <Text style={{ fontFamily: "Courier" }}>checkout.session.completed</Text>,
          {" "}<Text style={{ fontFamily: "Courier" }}>checkout.session.expired</Text>,
          {" "}<Text style={{ fontFamily: "Courier" }}>payment_intent.payment_failed</Text>.
        </Text>
        <Text style={s.p}>Dann den Signing-Secret kopieren (beginnt mit whsec_).</Text>
      </Step>

      <Text style={s.h1}>5. PayPal-Keys holen</Text>
      <Step n={1} title="App auf PayPal Developer anlegen">
        <Text style={s.p}>
          Auf developer.paypal.com → "Apps &amp; Credentials" → "Create App". Sandbox für Tests, Live später.
        </Text>
      </Step>
      <Step n={2} title="Client ID + Secret kopieren">
        <Text style={s.p}>Du brauchst beides für die <Text style={{ fontFamily: "Courier" }}>.env</Text>.</Text>
      </Step>

      <Text style={s.h1}>6. Resend (Email)</Text>
      <Step n={1} title="API-Key erstellen">
        <Text style={s.p}>
          Auf resend.com → API Keys → Create. Den Key kopieren.
        </Text>
      </Step>
      <Step n={2} title="Domain verifizieren (für eigene Absender-Adresse)">
        <Text style={s.p}>
          Unter "Domains" deine Domain (z.B. <Text style={{ fontFamily: "Courier" }}>deinedomain.ch</Text>) eintragen
          und die DNS-Einträge (TXT, MX) bei deinem Domain-Anbieter setzen. Erst dann kannst du
          von <Text style={{ fontFamily: "Courier" }}>bestellungen@deinedomain.ch</Text> verschicken.
        </Text>
      </Step>

      <Text style={s.h1}>7. UploadThing (Bilder)</Text>
      <Step n={1} title="Token holen">
        <Text style={s.p}>
          Auf uploadthing.com → Dashboard → API Keys → den Token kopieren (lange Zeichenfolge).
        </Text>
      </Step>

      <PageFooter />
    </Page>

    {/* PAGE 3: .env */}
    <Page size="A4" style={s.page}>
      <Text style={s.h1}>8. .env-Datei ausfüllen</Text>
      <Text style={s.p}>
        Im Projektordner (<Text style={{ fontFamily: "Courier" }}>Leon Projekt/</Text>) öffnest du
        die Datei <Text style={{ fontFamily: "Courier" }}>.env</Text> mit VS Code und füllst alle Werte aus,
        die du gerade gesammelt hast.
      </Text>

      <View style={s.warn}>
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>⚠ Sicherheits-Hinweis</Text>
        <Text>
          Die <Text style={{ fontFamily: "Courier" }}>.env</Text> NIEMALS auf GitHub hochladen oder
          weitergeben! Sie enthält geheime Keys, mit denen Geld bewegt werden kann. Sie ist bereits
          in <Text style={{ fontFamily: "Courier" }}>.gitignore</Text> eingetragen.
        </Text>
      </View>

      <Text style={s.h2}>Beispiel-.env mit allen Werten:</Text>
      <Text style={s.code}>{`# Datenbank (von Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Auth — generiere mit: openssl rand -base64 32
AUTH_SECRET="hier_ein_zufaelliger_string_mit_min_32_zeichen"
AUTH_URL="https://deinedomain.ch"

# Shop
NEXT_PUBLIC_SHOP_NAME="Leon's Lego Shop"
NEXT_PUBLIC_SHOP_URL="https://deinedomain.ch"
NEXT_PUBLIC_CURRENCY="CHF"

# UploadThing
UPLOADTHING_TOKEN="dein_uploadthing_token"

# Resend
RESEND_API_KEY="re_..."
EMAIL_FROM="bestellungen@deinedomain.ch"
EMAIL_REPLY_TO="kontakt@deinedomain.ch"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# PayPal
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
NEXT_PUBLIC_PAYPAL_CLIENT_ID="..."
PAYPAL_ENV="sandbox"   # spaeter "live"

# Erster Admin-Login
SEED_ADMIN_EMAIL="dein@email.ch"
SEED_ADMIN_PASSWORD="MeinSicheresPasswort1!"`}</Text>

      <Text style={s.h2}>AUTH_SECRET generieren</Text>
      <Text style={s.p}>Im Terminal ausführen:</Text>
      <Text style={s.code}>openssl rand -base64 32</Text>
      <Text style={s.p}>Den ausgegebenen String als AUTH_SECRET einsetzen.</Text>

      <Text style={s.h1}>9. Installation &amp; Erststart</Text>
      <Text style={s.p}>Im Terminal in den Projektordner wechseln:</Text>
      <Text style={s.code}>cd "/Users/yannick/Library/Mobile Documents/com~apple~CloudDocs/Webdesign/Leon Projekt"</Text>

      <Text style={s.p}>Dann der Reihe nach diese Befehle:</Text>
      <Text style={s.code}>{`# 1. Pakete installieren
npm install

# 2. Datenbank-Tabellen anlegen
npm run db:push

# 3. Admin-User + Versand-Beispiele anlegen
npm run db:seed

# 4. Server starten
npm run dev`}</Text>

      <Text style={s.p}>
        Wenn alles geklappt hat, siehst du im Terminal:{" "}
        <Text style={{ fontFamily: "Courier" }}>Ready in ...ms</Text> und{" "}
        <Text style={{ fontFamily: "Courier" }}>Local: http://localhost:3000</Text>
      </Text>
      <Text style={s.p}>
        Öffne <Text style={{ fontFamily: "Courier" }}>http://localhost:3000</Text> im Browser. Done!
      </Text>

      <PageFooter />
    </Page>

    {/* PAGE 4: Erste Schritte Admin */}
    <Page size="A4" style={s.page}>
      <Text style={s.h1}>10. Erste Schritte im Admin-Panel</Text>

      <Step n={1} title="Anmelden">
        <Text style={s.p}>
          Gehe auf <Text style={{ fontFamily: "Courier" }}>http://localhost:3000/admin</Text>.
          Login mit der Email + Passwort, die du in <Text style={{ fontFamily: "Courier" }}>SEED_ADMIN_EMAIL</Text>
          {" "}und <Text style={{ fontFamily: "Courier" }}>SEED_ADMIN_PASSWORD</Text> gesetzt hast.
        </Text>
      </Step>

      <Step n={2} title="Firmendaten eintragen">
        <Text style={s.p}>
          Gehe auf <Text style={{ fontFamily: "Courier" }}>Einstellungen</Text> und fülle
          Firmenname, Adresse, Email, UID-Nr. (CHE-...) aus. Diese erscheinen dann automatisch
          auf Rechnungen, im Impressum und in der Datenschutzerklärung.
        </Text>
      </Step>

      <Step n={3} title="Kategorien prüfen">
        <Text style={s.p}>
          Standard angelegt: Lego Sets, Minifiguren, Lose Teile, Zubehör.
          Du kannst sie bei <Text style={{ fontFamily: "Courier" }}>Kategorien</Text> bearbeiten,
          umbenennen oder neue hinzufügen.
        </Text>
      </Step>

      <Step n={4} title="Erstes Produkt anlegen">
        <Text style={s.p}>
          Auf <Text style={{ fontFamily: "Courier" }}>Produkte → + Produkt anlegen</Text>:
        </Text>
        <Bullet>Name, Beschreibung, Kategorie, Zustand wählen</Bullet>
        <Bullet>Preis in CHF eintragen</Bullet>
        <Bullet>Bilder hochladen (zieh sie ins Drop-Feld, max. 10 Stück)</Bullet>
        <Bullet>Bei Minifiguren: Versand-Kategorie auf "Minifigur" setzen — wichtig für die Versand-Engine!</Bullet>
        <Bullet>Bei Sets entsprechend "Kleines Set" oder "Grosses Set"</Bullet>
        <Bullet>Speichern und im Shop unter <Text style={{ fontFamily: "Courier" }}>/produkte</Text> ansehen</Bullet>
      </Step>

      <Text style={s.h1}>11. Versand-Engine konfigurieren</Text>
      <Text style={s.p}>
        Unter <Text style={{ fontFamily: "Courier" }}>Versand</Text> findest du Methoden &amp; Regeln.
        Schon vorgefertigt:
      </Text>

      <View style={s.table}>
        <View style={s.trFirst}>
          <Text style={[s.th, { width: "30%" }]}>Methode</Text>
          <Text style={[s.th, { width: "20%" }]}>Preis</Text>
          <Text style={[s.th, { width: "50%" }]}>Wann (Regel)</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "30%" }]}>B-Post Brief</Text>
          <Text style={[s.td, { width: "20%" }]}>CHF 1.40</Text>
          <Text style={[s.td, { width: "50%" }]}>max. 20 Minifiguren, keine Sets, max. 500g</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "30%" }]}>B-Post Päckli</Text>
          <Text style={[s.td, { width: "20%" }]}>CHF 8.50</Text>
          <Text style={[s.td, { width: "50%" }]}>bis 100 Items, max. 2000g</Text>
        </View>
        <View style={s.tr}>
          <Text style={[s.td, { width: "30%" }]}>B-Post Paket</Text>
          <Text style={[s.td, { width: "20%" }]}>CHF 12.00</Text>
          <Text style={[s.td, { width: "50%" }]}>alles andere (Fallback)</Text>
        </View>
      </View>

      <Text style={s.p}>
        Die Werte kannst du frei anpassen. Logik:{" "}
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Höhere Priorität</Text> wird zuerst geprüft.
        Erste passende Regel gewinnt. Methode ohne Regel gilt immer (Fallback).
      </Text>

      <Text style={s.h2}>Beispiel-Erweiterung: Express-Versand für teure Bestellungen</Text>
      <Bullet>Neue Methode "A-Post Express" mit Preis CHF 4.00</Bullet>
      <Bullet>Neue Regel mit "Min. Bestellwert: 100" → Methode "A-Post Express", Priorität 200</Bullet>
      <Bullet>So wird Express bei Bestellungen ab CHF 100 angeboten</Bullet>

      <PageFooter />
    </Page>

    {/* PAGE 5: Deployment */}
    <Page size="A4" style={s.page}>
      <Text style={s.h1}>12. Online stellen (Deployment)</Text>

      <Text style={s.h2}>Variante A: Vercel (empfohlen, einfachster Weg)</Text>

      <Step n={1} title="GitHub-Account anlegen + Code pushen">
        <Text style={s.p}>Auf github.com einen Account erstellen, dann im Terminal:</Text>
        <Text style={s.code}>{`git init
git add .
git commit -m "Initial commit"
# Auf github.com ein neues Repo erstellen, dann:
git remote add origin https://github.com/DEINUSER/lego-shop.git
git push -u origin main`}</Text>
      </Step>

      <Step n={2} title="Vercel verbinden">
        <Text style={s.p}>
          Auf vercel.com mit GitHub-Account einloggen → "New Project" → dein Repo wählen → Import.
        </Text>
      </Step>

      <Step n={3} title="Environment-Variablen eintragen">
        <Text style={s.p}>
          Vor dem Deploy: ALLE Werte aus deiner <Text style={{ fontFamily: "Courier" }}>.env</Text>
          {" "}im Vercel-Dashboard unter "Environment Variables" eintragen. Wichtig:
          {" "}<Text style={{ fontFamily: "Courier" }}>NEXT_PUBLIC_SHOP_URL</Text> auf die Vercel-URL setzen.
        </Text>
      </Step>

      <Step n={4} title="Deployen">
        <Text style={s.p}>
          Auf "Deploy" klicken. Nach 1–2 Minuten ist deine Seite online unter
          {" "}<Text style={{ fontFamily: "Courier" }}>dein-projekt.vercel.app</Text>.
        </Text>
      </Step>

      <Step n={5} title="Eigene Domain verbinden">
        <Text style={s.p}>
          Im Vercel-Dashboard unter "Domains" deine Domain eintragen. Vercel zeigt dir, welche
          DNS-Einträge du beim Domain-Anbieter setzen musst (meist 1 A-Record + 1 CNAME).
        </Text>
      </Step>

      <Step n={6} title="Webhook-URLs in Stripe + PayPal anpassen">
        <Text style={s.p}>
          Stripe-Dashboard → Webhooks: URL ändern auf{" "}
          <Text style={{ fontFamily: "Courier" }}>https://deinedomain.ch/api/webhooks/stripe</Text>.
          PayPal Developer → App: Return-URL anpassen.
        </Text>
      </Step>

      <View style={s.ok}>
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>✓ Wichtig</Text>
        <Text>
          Bei jedem <Text style={{ fontFamily: "Courier" }}>git push</Text> deployt Vercel automatisch
          die neue Version. Du musst nicht manuell deployen.
        </Text>
      </View>

      <Text style={s.h2}>Variante B: Eigener Server (VPS)</Text>
      <Text style={s.p}>
        Wenn du einen eigenen Server hast (z.B. Hetzner, DigitalOcean):
      </Text>
      <Text style={s.code}>{`# Auf dem Server, nach git clone + npm install:
npm run build
npm start    # laeuft auf Port 3000`}</Text>
      <Text style={s.p}>
        Davor brauchst du einen Reverse-Proxy (Caddy oder Nginx) für HTTPS. Vercel ist 10× einfacher.
      </Text>

      <Text style={s.h1}>13. Test-Bestellung machen</Text>
      <Step n={1} title="Mit Stripe-Testkarte">
        <Text style={s.p}>
          Solange Stripe im Test-Modus ist, kannst du diese Karte verwenden:
        </Text>
        <Text style={s.code}>{`Karte:    4242 4242 4242 4242
Datum:    beliebig in der Zukunft (z.B. 12/30)
CVC:      beliebige 3 Ziffern (z.B. 123)
PLZ:      beliebig (z.B. 8001)`}</Text>
      </Step>
      <Step n={2} title="Im Admin prüfen">
        <Text style={s.p}>
          Bestellung erscheint unter <Text style={{ fontFamily: "Courier" }}>Bestellungen</Text>.
          Status auf "Versendet" setzen, Tracking-Nr. eintragen, PDF-Rechnung herunterladen.
          Kunde bekommt automatisch Email-Benachrichtigungen.
        </Text>
      </Step>

      <PageFooter />
    </Page>

    {/* PAGE 6: TODO + Befehle */}
    <Page size="A4" style={s.page}>
      <Text style={s.h1}>14. Was du noch selbst tun musst</Text>

      <Text style={s.h2}>Vor dem Live-Gang</Text>
      <Bullet>Stripe + PayPal von Test- auf Live-Modus umstellen, Live-Keys eintragen</Bullet>
      <Bullet>Webhook-URLs auf Produktiv-Domain anpassen</Bullet>
      <Bullet>Resend-Domain verifizieren (sonst landen Mails im Spam)</Bullet>
      <Bullet>Im Admin → Einstellungen alle Firmendaten ausfüllen (UID-Nr., Adresse, IBAN)</Bullet>
      <Bullet>AGB, Datenschutz, Impressum, Widerruf einmal komplett durchlesen und an deine Realität anpassen</Bullet>
      <Bullet>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Empfohlen:</Text> Anwalt-Check der AGB für gewerblichen CH-Verkauf
      </Bullet>
      <Bullet>Erste Produkte einpflegen, mindestens 5–10 für eine glaubwürdige Startseite</Bullet>
      <Bullet>Versand-Regeln in /admin/versand auf eure realen Schweizer-Post-Tarife anpassen</Bullet>
      <Bullet>Test-Bestellung mit echter Karte machen, sobald live</Bullet>

      <Text style={s.h2}>Steuern (CH)</Text>
      <Bullet>
        Ab <Text style={{ fontFamily: "Helvetica-Bold" }}>CHF 100'000 Jahresumsatz</Text> seid ihr MwSt-pflichtig.
        Davor optional.
      </Bullet>
      <Bullet>Buchhaltung: Bestellungs-CSV monatlich exportieren (im Admin unter "Export")</Bullet>
      <Bullet>Aufbewahrungspflicht für Geschäftsunterlagen: 10 Jahre</Bullet>

      <Text style={s.h1}>15. Wichtige Befehle</Text>

      <Text style={s.h2}>Im Alltag</Text>
      <Text style={s.code}>{`npm run dev        # Server lokal starten (Port 3000)
npm run build      # Production-Build erstellen
npm run db:studio  # Datenbank-GUI im Browser oeffnen
npm run db:seed    # Beispieldaten neu laden`}</Text>

      <Text style={s.h2}>Wenn du das Schema änderst</Text>
      <Text style={s.code}>{`npm run db:push    # Schema-Aenderungen in DB schreiben
npm run db:generate # Prisma-Client neu generieren`}</Text>

      <Text style={s.h1}>16. Troubleshooting</Text>

      <Text style={s.h2}>"Cannot connect to database"</Text>
      <Bullet>Connection-String in .env prüfen</Bullet>
      <Bullet>Bei Neon: ist das Projekt aktiv? Inaktive Projekte werden pausiert</Bullet>
      <Bullet>SSL-Mode am Ende der URL: <Text style={{ fontFamily: "Courier" }}>?sslmode=require</Text></Bullet>

      <Text style={s.h2}>"Stripe webhook signature failed"</Text>
      <Bullet>STRIPE_WEBHOOK_SECRET muss zur registrierten Webhook-URL passen</Bullet>
      <Bullet>Live-Mode? Dann ist es ein anderer Secret als im Test-Mode</Bullet>

      <Text style={s.h2}>"Email kommt nicht an"</Text>
      <Bullet>Resend-Domain verifiziert? Sonst nur an die eigene Email-Adresse möglich</Bullet>
      <Bullet>Spam-Ordner prüfen</Bullet>
      <Bullet>EMAIL_FROM muss zur verifizierten Domain passen</Bullet>

      <Text style={s.h2}>"Bilder werden nicht angezeigt"</Text>
      <Bullet>UPLOADTHING_TOKEN in .env korrekt?</Bullet>
      <Bullet>Browser-Konsole (F12) öffnen — gibt es Fehler?</Bullet>

      <View style={[s.ok, { marginTop: 20 }]}>
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Du hast es geschafft!</Text>
        <Text>
          Wenn du bis hier durchgekommen bist, hast du einen voll funktionsfähigen, sicheren
          Lego-Shop am Laufen. Bei Fragen die README.md im Projektordner — da steht alles
          nochmal drin.
        </Text>
      </View>

      <PageFooter />
    </Page>
  </Document>
);

const outDir = path.resolve(process.cwd(), "public");
const outPath = path.join(outDir, "setup-anleitung.pdf");

(async () => {
  await renderToFile(<Doc />, outPath);
  console.log(`✓ PDF generiert: ${outPath}`);
})();
