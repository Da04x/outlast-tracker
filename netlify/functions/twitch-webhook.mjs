import { store, readState, writeState } from "./_store.mjs";

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export default async function (req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.text();
  const id = req.headers.get("Twitch-Eventsub-Message-Id") || "";
  const ts = req.headers.get("Twitch-Eventsub-Message-Timestamp") || "";
  const received = req.headers.get("Twitch-Eventsub-Message-Signature") || "";
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!secret) return new Response("Webhook secret missing", { status: 503 });
  const expected = "sha256=" + await hmac(secret, id + ts + body);
  if (received !== expected) return new Response("Unauthorized", { status: 401 });

  let data;
  try { data = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (data.challenge) return new Response(data.challenge, { headers: { "content-type": "text/plain" } });

  const type = data.subscription?.type;
  if (!["channel.subscribe", "channel.subscription.gift"].includes(type)) return new Response("ok");
  const s = store();
  if (id && await s.get(`event:${id}`)) return new Response("duplicate");

  const state = await readState();
  const increment = type === "channel.subscription.gift" ? Math.max(1, Number(data.event?.total) || 1) : 1;
  const count = Math.min(400, Math.max(0, Number(state.count) || 183) + increment);
  await writeState({ ...state, count, mode: "TWITCH" });
  if (id) await s.set(`event:${id}`, "1", { expirationTtl: 86400 });
  return new Response("ok");
}
export const config = { path: "/api/twitch/webhook" };
