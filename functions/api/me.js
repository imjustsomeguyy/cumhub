import { isAuthed, json } from "./_lib/auth.js";

export async function onRequestGet({ request, env }) {
  return json({ authed: await isAuthed(request, env) });
}
