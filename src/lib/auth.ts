const COOKIE_NAME = "admin_session";

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "medbook-dev";
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + 24 * 60 * 60 * 1000 });
  const encoded = btoa(payload).replace(/=/g, "");
  const sig = await hmacSign(getSecret(), encoded);
  return `${encoded}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return false;

    const payload = JSON.parse(atob(encoded));
    if (Date.now() > payload.exp) return false;

    const expected = await hmacSign(getSecret(), encoded);
    return sig === expected;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
