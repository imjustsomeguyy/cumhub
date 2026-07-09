import { makeSessionCookie, json } from "./_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (!password || password !== env.ADMIN_PASSWORD) {
    return json({ error: "Incorrect password." }, 401);
  }

  const cookie = await makeSessionCookie(env);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
  });
}
