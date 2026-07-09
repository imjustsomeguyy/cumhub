import { isAuthed, json } from "./_lib/auth.js";

// GET /api/apps -> public list of every app card
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, name, description, url, icon, created_at FROM apps ORDER BY created_at DESC"
  ).all();
  return json({ apps: results });
}

// POST /api/apps -> admin only, add a new app card
export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: "Not authenticated." }, 401);

  const body = await request.json().catch(() => ({}));
  const { name, description, url, icon } = body;
  if (!name || !url) return json({ error: "Name and URL are required." }, 400);

  await env.DB.prepare(
    "INSERT INTO apps (name, description, url, icon) VALUES (?, ?, ?, ?)"
  )
    .bind(name, description || "", url, icon || "")
    .run();

  return json({ ok: true });
}
