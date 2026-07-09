import { isAuthed, json } from "../_lib/auth.js";

export async function onRequestDelete({ request, env, params }) {
  if (!(await isAuthed(request, env))) return json({ error: "Not authenticated." }, 401);

  const row = await env.DB.prepare("SELECT r2_key FROM images WHERE id = ?")
    .bind(params.id)
    .first();

  if (row) {
    await env.BUCKET.delete(row.r2_key);
    await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(params.id).run();
  }

  return json({ ok: true });
}
