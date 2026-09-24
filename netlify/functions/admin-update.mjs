import { readState, writeState } from "./_store.mjs";

export default async function (req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = process.env.ADMIN_KEY;
  if (!key || req.headers.get("x-admin-key") !== key) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const count = Number(body.count);
    if (!Number.isFinite(count) || count < 0 || count > 400) {
      return Response.json({ error: "Count must be between 0 and 400" }, { status: 400 });
    }
    const state = await readState();
    await writeState({ ...state, count: Math.floor(count), mode: "MANUAL" });
    return Response.json({ ok: true, count: Math.floor(count) });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
export const config = { path: "/api/admin/update" };
