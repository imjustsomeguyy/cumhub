// Small helper for stateless admin sessions using a signed cookie.
// No database/session table needed — the cookie itself is the proof.

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function makeSessionCookie(env) {
  const expires = Date.now() + 1000 * 60 * 60 * 12; // 12 hour session
  const payload = `${expires}`;
  const sig = await hmac(env.SESSION_SECRET, payload);
  const value = `${payload}.${sig}`;
  return `session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`;
}

export function clearSessionCookie() {
  return `session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAuthed(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) return false;
  const [payload, sig] = match[1].split(".");
  if (!payload || !sig) return false;
  const expected = await hmac(env.SESSION_SECRET, payload);
  if (expected !== sig) return false;
  if (Number(payload) < Date.now()) return false;
  return true;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
