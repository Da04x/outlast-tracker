import { readState } from "./_store.mjs";

export default async function () {
  const s = await readState();
  const count = Math.max(0, Math.min(400, Number(s.count) || 0));
  return Response.json({ count, mode: s.mode || "MANUAL" }, {
    headers: { "Cache-Control": "no-store" }
  });
}

export const config = { path: "/api/state" };
