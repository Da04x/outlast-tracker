import { store } from "./_store.mjs";

function randomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

export default async function (req) {
  if (req.method !== "POST") return Response.json({ error: "Use the Generate Twitch Auth Link button in /admin.html" }, { status: 405 });
  const admin = process.env.ADMIN_KEY;
  if (!admin || req.headers.get("x-admin-key") !== admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.TWITCH_CLIENT_ID) return Response.json({ error: "TWITCH_CLIENT_ID is missing" }, { status: 503 });

  const state = randomState();
  await store().set(`oauth_state:${state}`, "1", { expirationTtl: 600 });
  const origin = new URL(req.url).origin;
  const redirect = `${origin}/api/twitch/callback`;
  const u = new URL("https://id.twitch.tv/oauth2/authorize");
  u.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  u.searchParams.set("redirect_uri", redirect);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "channel:read:subscriptions");
  u.searchParams.set("state", state);
  return Response.json({ url: u.toString() });
}
export const config = { path: "/api/twitch/connect" };
