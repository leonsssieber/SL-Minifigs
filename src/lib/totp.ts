// TOTP (RFC 6238) — implemented with Node.js crypto, no external dependencies.
// Node.js-only (not edge-compatible). Import only from server-side code.

import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from "crypto";
import bcrypt from "bcryptjs";

// ── Base32 helpers ──────────────────────────────────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  return out;
}

function base32Decode(encoded: string): Buffer {
  const str = encoded.toUpperCase().replace(/=+$/, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const char of str) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base32 char: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

// ── Secret encryption (AES-256-GCM) ─────────────────────────
function getDerivedKey(): Buffer {
  return scryptSync(process.env.AUTH_SECRET!, "sl-2fa-totp-v1", 32);
}

export function encryptTotpSecret(plainSecret: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plainSecret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}:${enc.toString("base64url")}:${tag.toString("base64url")}`;
}

export function decryptTotpSecret(encrypted: string): string {
  const [ivB64, encB64, tagB64] = encrypted.split(":");
  const key = getDerivedKey();
  const iv = Buffer.from(ivB64, "base64url");
  const enc = Buffer.from(encB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// ── TOTP core ────────────────────────────────────────────────
const TOTP_STEP = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // ±1 step tolerance

function generateHotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  // Write counter as 64-bit big-endian
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  buf.writeUInt32BE(hi, 0);
  buf.writeUInt32BE(lo, 4);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function getTotpUri(plainSecret: string, email: string, issuer = "SL Minifigs Admin"): string {
  const params = new URLSearchParams({ secret: plainSecret, issuer, algorithm: "SHA1", digits: String(TOTP_DIGITS), period: String(TOTP_STEP) });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params}`;
}

export function verifyTotpCode(token: string, encryptedSecret: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  try {
    const secret = decryptTotpSecret(encryptedSecret);
    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / TOTP_STEP);
    for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
      if (generateHotp(secret, counter + delta) === token) return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Recovery codes ───────────────────────────────────────────
export function generateRecoveryCodes(): string[] {
  return Array.from({ length: 10 }, () => {
    const hex = randomBytes(5).toString("hex").toUpperCase();
    return `${hex.slice(0, 5)}-${hex.slice(5)}`;
  });
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(code.replace(/-/g, "").toUpperCase(), 10);
}

export async function verifyRecoveryCode(input: string, hash: string): Promise<boolean> {
  return bcrypt.compare(input.replace(/-/g, "").toUpperCase(), hash);
}
