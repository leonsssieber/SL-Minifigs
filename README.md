# SL Minifigs

E-Commerce-Platform für den Wiederverkauf von LEGO® Minifiguren, Sets und Einzelteilen — mit Schweizer Versand-Engine, Stripe + PayPal, Admin-Panel und User-Konten. Optimiert für **Vercel + Neon**.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript + React 19
- **PostgreSQL** (Neon) + Prisma ORM
- **Auth.js v5** (NextAuth) — JWT-Sessions, bcrypt
- **Tailwind CSS** + shadcn-Style UI
- **UploadThing** für Bilder
- **Nodemailer** (Gmail SMTP) + React Email für transaktionale Emails
- **Stripe** + **PayPal** für Bezahlung
- **@react-pdf/renderer** für Rechnungen
- **Upstash Redis** für Rate-Limiting (Pflicht in Produktion auf Vercel)

---

## Schnellstart in Produktion (Vercel)

### 1. Neon-Datenbank anlegen

1. Account auf [neon.tech](https://neon.tech) erstellen (gratis).
2. Neues Projekt anlegen — Region am besten **Frankfurt** (`eu-central-1`).
3. Connection-Strings notieren:
   - `DATABASE_URL` = die **Pooled** Connection (mit `-pooler` im Hostnamen)
   - `DIRECT_URL` = die **Direct** Connection

### 2. Externe Dienste registrieren

| Dienst | URL | Wofür |
|---|---|---|
| **Stripe** | https://dashboard.stripe.com | Kreditkarte |
| **PayPal Developer** | https://developer.paypal.com | PayPal |
| **Gmail App-Password** | https://myaccount.google.com/apppasswords | Versand der Transaktions-Emails (2-Faktor muss aktiv sein) |
| **UploadThing** | https://uploadthing.com | Produktbilder (2 GB gratis) |
| **Upstash** | https://console.upstash.com | Redis Rate-Limit (gratis tier reicht) |

### 3. Auf Vercel deployen

```bash
npm i -g vercel
vercel
```

Im Vercel-Dashboard unter **Settings → Environment Variables** alle Variablen aus `.env.example` setzen. Danach **Redeploy** auslösen, damit Prisma die `DATABASE_URL` zur Build-Zeit sieht.

### 4. Erstmaliges Schema-Deploy

Lokal mit der **Prod**-`DATABASE_URL`:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Das legt den ersten Admin-Account an (Login = `SEED_ADMIN_EMAIL`, Passwort = `SEED_ADMIN_PASSWORD`).
**Sofort nach dem ersten Login das Passwort im Konto ändern.**

### 5. Webhooks registrieren

**Stripe** (https://dashboard.stripe.com/webhooks):
- URL: `https://<deine-domain>/api/webhooks/stripe`
- Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`
- Signing-Secret in Vercel als `STRIPE_WEBHOOK_SECRET` setzen.

**PayPal** (https://developer.paypal.com/dashboard):
- URL: `https://<deine-domain>/api/paypal/capture`
- Webhook-ID in Vercel als `PAYPAL_WEBHOOK_ID` setzen.

### 6. Domain verbinden (optional)

In Vercel unter **Settings → Domains** eine eigene Domain (z. B. `slminifigs.ch`) hinzufügen. Danach die `NEXT_PUBLIC_SHOP_URL`-ENV anpassen und Webhook-URLs aktualisieren.

---

## Lokale Entwicklung

```bash
cp .env.example .env
# .env mit Werten füllen — minimal: DATABASE_URL + AUTH_SECRET
npm install
npm run db:push    # erstellt das Schema in der DB
npm run db:seed    # legt Admin + Beispieldaten an
npm run dev
```

`AUTH_SECRET` generieren:
- macOS/Linux: `openssl rand -base64 32`
- Windows PowerShell: `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`

---

## Struktur

```
src/
├── app/
│   ├── (shop)/         # Public-Shop
│   ├── (auth)/         # Login/Register
│   ├── konto/          # User-Konto
│   ├── admin/          # Admin-Panel
│   └── api/            # Webhooks, PDF, CSV
├── components/         # UI + Layout
├── lib/                # db, auth, shipping, stripe, paypal, pdf, email
├── server/actions/     # Server Actions (alle Mutations)
└── middleware.ts       # Auth-Guard
prisma/
├── schema.prisma       # PostgreSQL-Schema
└── seed.ts             # Beispiel-Daten
vercel.json             # Vercel-Konfiguration (Region, Build, Function-Timeouts)
```

---

## Versand-Engine

Im Admin unter `/admin/versand`:

1. **Versandmethoden** anlegen (Brief, Päckli, Paket) mit Basispreis.
2. **Versandregeln** definieren — z. B.:
   - „Brief: max. 20 Minifiguren" (Priorität 100)
   - „Päckli: bis 100 Items" (Priorität 50)
   - „Paket: alles andere" (Priorität 0, keine Bedingungen = Fallback)

Beim Checkout wertet der Calculator die Regeln nach Priorität aus und zeigt nur passende Methoden an. Pro Produkt kann eine **Versand-Kategorie** (`minifigure`, `small_set`, `large_set`) und ein **Versand-Override** gesetzt werden.

---

## Sicherheit (eingebaut)

- bcrypt mit Cost 12 für Passwörter
- HttpOnly + Secure Cookies (auto in Produktion)
- CSRF-Schutz via Next.js Server Actions
- Rate-Limiting auf Login/Register/Reset/Checkout/Contact (Upstash Redis in Prod)
- Stripe + PayPal Webhook-Signatur-Verifikation
- Zod-Validierung an allen Eingängen
- Prisma (parametrisierte Queries) → kein SQL-Injection
- DOMPurify für ggf. Rich-Text-Felder
- Honeypot-Felder gegen Bot-Submits
- Security-Headers (CSP, HSTS, X-Frame-Options, …)
- Audit-Log für Admin-Aktionen
- Email-Verifikation für neue Accounts

---

## Was du selbst noch tun musst

- [ ] Echte Stripe + PayPal Live-Keys eintragen
- [ ] Eigene Domain kaufen + auf Vercel zeigen
- [ ] Gmail-App-Password generieren und als `SMTP_PASS` setzen (siehe `.env.example`). Bei höherem Volumen auf Resend/Postmark wechseln und Sending-Domain verifizieren.
- [ ] AGB, Datenschutz, Impressum, Widerruf in `/admin/einstellungen` mit Firmendaten füllen
- [ ] Versandregeln in `/admin/versand` an deine Realität anpassen
- [ ] **Empfohlen:** AGB von einer Fachperson für CH-Gewerbe prüfen lassen

---

## Häufige Befehle

```bash
npm run dev              # Dev-Server
npm run build            # Production-Build (lokal testen)
npm run db:studio        # Prisma Studio (DB-GUI)
npm run db:push          # Schema-Änderungen pushen (Dev)
npm run db:migrate       # Saubere Migration (Prod)
npm run db:seed          # Admin + Defaults anlegen
```

---

## Test-Bestellung (Stripe Sandbox)

- Karte: `4242 4242 4242 4242`
- Datum: beliebig in der Zukunft
- CVC: 3 Ziffern

Mehr Test-Karten: https://stripe.com/docs/testing

---

## Bekannte Einschränkungen

- Aktuell nur 1 Sprache (Deutsch).
- Nur 1 Währung (CHF). Multiwährung erfordert Erweiterung.
- MwSt-Logik ist im Schema vorbereitet, aber nicht aktiv. Ab CHF 100 000 Jahresumsatz nötig.
