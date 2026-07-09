import { isAuthed, json } from "./_lib/auth.js";

// GET /api/images -> public list of image records (metadata only)
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, employee_name, r2_key, created_at FROM images ORDER BY created_at DESC"
  ).all();
  return json({ images: results });
}

// POST /api/images -> admin only, upload a file (multipart/form-data)
// Expects fields: "file" (the image) and "employee_name" (text)
export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: "Not authenticated." }, 401);

  const form = await request.formData();
  const file = form.get("file");
  const employeeName = form.get("employee_name") || "";

  if (!file || typeof file === "string") {
    return json({ error: "No file uploaded." }, 400);
  }

  const key = `${crypto.randomUUID()}-${file.name}`;
  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  await env.DB.prepare(
    "INSERT INTO images (filename, employee_name, r2_key) VALUES (?, ?, ?)"
  )
    .bind(file.name, employeeName, key)
    .run();

  return json({ ok: true });
}
