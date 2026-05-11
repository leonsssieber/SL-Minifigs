// 2FA cookie signing/verification — edge-compatible (Web Crypto API only)
// This file may be imported from middleware (Edge runtime).

const COOKIE_NAME = "sl_2fa";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export { COOKIE_NAME as TWO_FA_COOKIE_NAME };

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getHmacKey(): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.AUTH_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function sign2faCookie(userId: string): Promise<string> {
  const expires = (Date.now() + MAX_AGE_MS).toString();
  const payload = `${userId}|${expires}`;
  const key = await getHmacKey();
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}|${toHex(sig)}`;
}

export async function verify2faCookie(value: string, userId: string): Promise<boolean> {
  try {
    const parts = value.split("|");
    if (parts.length !== 3) return false;
    const [uid, expires, sig] = parts;
    if (uid !== userId) return false;
    if (Date.now() > Number(expires)) return false;

    const payload = `${uid}|${expires}`;
    const key = await getHmacKey();
    const expectedBuf = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = toHex(expectedBuf);

    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
