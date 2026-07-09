export async function onRequestGet({ env, params }) {
  const row = await env.DB.prepare("SELECT r2_key FROM images WHERE id = ?")
    .bind(params.id)
    .first();

  if (!row) return new Response("Not found", { status: 404 });

  const object = await env.BUCKET.get(row.r2_key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
