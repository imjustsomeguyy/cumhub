import { isAuthed, json } from "../_lib/auth.js";

export async function onRequestDelete({ request, env, params }) {
  if (!(await isAuthed(request, env))) return json({ error: "Not authenticated." }, 401);

  await env.DB.prepare("DELETE FROM apps WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
