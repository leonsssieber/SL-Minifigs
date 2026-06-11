import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const db = new PrismaClient();

// Zufälliges Passwort, das die Passwort-Policy erfüllt (Gross-/Kleinbuchstabe, Zahl).
// Bewusst KEIN fixer Default wie "ChangeMe123!" — bekannte Default-Passwörter
// auf einem Live-Shop sind ein offenes Scheunentor.
function generatePassword(): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = lower + upper + digits;
  let pw = lower[randomInt(lower.length)] + upper[randomInt(upper.length)] + digits[randomInt(digits.length)];
  for (let i = 0; i < 13; i++) pw += all[randomInt(all.length)];
  return pw;
}

async function main() {
  console.log("🌱 Seeding...");

  // Admin-User: Wird NUR angelegt, wenn er noch nicht existiert.
  // Ein erneuter Seed überschreibt NIEMALS ein bestehendes Passwort —
  // genau das hat früher Passwörter still auf den Seed-Wert zurückgesetzt.
  const email = (process.env.SEED_ADMIN_EMAIL ?? "slminifigs@gmail.com").toLowerCase();
  const existing = await db.user.findUnique({ where: { email }, select: { id: true, isAdmin: true } });

  if (existing) {
    if (!existing.isAdmin) {
      await db.user.update({ where: { email }, data: { isAdmin: true } });
      console.log(`  ✓ Admin-Rechte gesetzt für bestehenden User: ${email} (Passwort unverändert)`);
    } else {
      console.log(`  ✓ Admin existiert bereits: ${email} (Passwort unverändert)`);
    }
  } else {
    const password = process.env.SEED_ADMIN_PASSWORD ?? generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.user.create({
      data: {
        email,
        hashedPassword,
        name: "SL Minifigs Admin",
        isAdmin: true,
        emailVerified: new Date(),
      },
    });
    if (process.env.SEED_ADMIN_PASSWORD) {
      console.log(`  ✓ Admin erstellt: ${email} (Passwort aus SEED_ADMIN_PASSWORD)`);
    } else {
      console.log(`  ✓ Admin erstellt: ${email}`);
      console.log(`  ⚠ Generiertes Einmal-Passwort: ${password}`);
      console.log(`    → Nach dem ersten Login sofort unter Konto → Einstellungen ändern!`);
    }
  }

  // SiteSettings: only set if not already configured (preserves admin edits across re-seeds)
  const settingDefaults: Array<{ key: string; value: string }> = [
    { key: "shop_legal_entity", value: "SL Minifigs" },
    { key: "shop_email", value: process.env.EMAIL_REPLY_TO ?? "slminifigs@gmail.com" },
  ];
  for (const s of settingDefaults) {
    const existing = await db.siteSetting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await db.siteSetting.create({ data: s });
    }
  }
  console.log(`  ✓ Default settings (only created if missing)`);

  // Beispiel-Kategorien
  const categories = [
    { slug: "lego-sets", name: "Lego Sets", description: "Komplette Lego-Sets aller Themen.", sortOrder: 1 },
    { slug: "minifiguren", name: "Minifiguren", description: "Minifiguren neu und gebraucht.", sortOrder: 2 },
    { slug: "lose-teile", name: "Lose Teile", description: "Einzelteile für eure Sammlung.", sortOrder: 3 },
    { slug: "zubehoer", name: "Zubehör", description: "Bauplatten, Werkzeuge, Aufbewahrung.", sortOrder: 4 },
  ];
  for (const c of categories) {
    await db.productCategory.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }
  console.log(`  ✓ ${categories.length} Kategorien`);

  // Beispiel-Versandmethoden
  const methods = [
    { id: "method-brief", name: "B-Post Brief", description: "Schweizerische Post, 2–3 Tage", basePrice: "1.40", sortOrder: 1 },
    { id: "method-paeckli", name: "B-Post Päckli", description: "Schweizerische Post, 2–3 Tage", basePrice: "8.50", sortOrder: 2 },
    { id: "method-paket", name: "B-Post Paket", description: "Schweizerische Post, ab 2kg", basePrice: "12.00", sortOrder: 3 },
  ];
  for (const m of methods) {
    await db.shippingMethod.upsert({
      where: { id: m.id },
      update: { name: m.name, description: m.description, basePrice: m.basePrice, sortOrder: m.sortOrder, active: true },
      create: { id: m.id, name: m.name, description: m.description, basePrice: m.basePrice, sortOrder: m.sortOrder, active: true },
    });
  }
  console.log(`  ✓ ${methods.length} Versandmethoden`);

  // Beispiel-Versandregeln
  const briefRule = await db.shippingRule.findFirst({ where: { methodId: "method-brief", name: "Brief: max. 20 Minifiguren" } });
  if (!briefRule) {
    await db.shippingRule.create({
      data: {
        name: "Brief: max. 20 Minifiguren",
        methodId: "method-brief",
        priority: 100,
        active: true,
        maxMinifigures: 20,
        maxSets: 0,
        maxWeightGrams: 500,
      },
    });
  }
  const paeckliRule = await db.shippingRule.findFirst({ where: { methodId: "method-paeckli", name: "Päckli: bis 100 Items" } });
  if (!paeckliRule) {
    await db.shippingRule.create({
      data: {
        name: "Päckli: bis 100 Items",
        methodId: "method-paeckli",
        priority: 50,
        active: true,
        maxItems: 100,
        maxWeightGrams: 2000,
      },
    });
  }
  const paketRule = await db.shippingRule.findFirst({ where: { methodId: "method-paket", name: "Paket: alles andere (Fallback)" } });
  if (!paketRule) {
    await db.shippingRule.create({
      data: {
        name: "Paket: alles andere (Fallback)",
        methodId: "method-paket",
        priority: 0,
        active: true,
      },
    });
  }
  console.log("  ✓ 3 Versandregeln");

  console.log("✅ Seed fertig.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
