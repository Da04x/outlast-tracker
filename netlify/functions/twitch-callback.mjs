import { store, readState, writeState } from "./_store.mjs";

async function twitch(url, options = {}) {
  const r = await fetch(url, options);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { r, data };
}

function page(title, body) {
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{background:#020302;color:#a7ff91;font:18px monospace;padding:40px;text-align:center}h1{font-size:28px}a{color:#a7ff91}</style>${body}`, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export default async function (req) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  if (!code || !state) return page("Connection failed", "<h1>Missing OAuth code/state</h1>");
  const env = process.env;
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.TWITCH_EVENTSUB_SECRET) {
    return page("Configuration missing", "<h1>TWITCH CONFIGURATION MISSING</h1><p>Check Netlify environment variables.</p>");
  }

  const blob = store();
  if (await blob.get(`oauth_state:${state}`) !== "1") return page("Invalid link", "<h1>INVALID OR EXPIRED AUTHORIZATION LINK</h1>");
  await blob.delete(`oauth_state:${state}`);

  const redirect = `${u.origin}/api/twitch/callback`;
  const tokenBody = new URLSearchParams({ client_id: env.TWITCH_CLIENT_ID, client_secret: env.TWITCH_CLIENT_SECRET, code, grant_type: "authorization_code", redirect_uri: redirect });
  const tok = await twitch("https://id.twitch.tv/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: tokenBody });
  if (!tok.r.ok || !tok.data.access_token) return page("Token failed", `<h1>TWITCH TOKEN EXCHANGE FAILED</h1><p>${JSON.stringify(tok.data)}</p>`);

  const access = tok.data.access_token;
  const users = await twitch("https://api.twitch.tv/helix/users", { headers: { "Client-ID": env.TWITCH_CLIENT_ID, "Authorization": `Bearer ${access}` } });
  const user = users.data?.data?.[0];
  if (!users.r.ok || !user) return page("Account failed", "<h1>COULD NOT IDENTIFY THE TWITCH ACCOUNT</h1>");

  const wanted = (env.TWITCH_BROADCASTER_LOGIN || "").toLowerCase().replace(/^@/, "");
  if (wanted && user.login.toLowerCase() !== wanted) return page("Wrong account", `<h1>WRONG TWITCH ACCOUNT</h1><p>Please authorize the channel owner account.</p>`);

  const callback = `${u.origin}/api/twitch/webhook`;
  const results = [];
  for (const type of ["channel.subscribe", "channel.subscription.gift"]) {
    const body = { type, version: "1", condition: { broadcaster_user_id: user.id }, transport: { method: "webhook", callback, secret: env.TWITCH_EVENTSUB_SECRET } };
    const sub = await twitch("https://api.twitch.tv/helix/eventsub/subscriptions", { method: "POST", headers: { "Client-ID": env.TWITCH_CLIENT_ID, "Authorization": `Bearer ${access}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    results.push({ type, status: sub.r.status, data: sub.data });
    if (!sub.r.ok && sub.r.status !== 409) return page("EventSub failed", `<h1>EVENTSUB REGISTRATION FAILED</h1><p>${type}</p><pre>${JSON.stringify(sub.data)}</pre>`);
  }

  const current = await readState();
  await blob.setJSON("twitch_auth", { userId: user.id, login: user.login, displayName: user.display_name, accessToken: access, refreshToken: tok.data.refresh_token, expiresIn: tok.data.expires_in, connectedAt: new Date().toISOString() });
  await writeState({ count: Math.max(183, Math.min(400, Number(current.count) || 183)), mode: "TWITCH", challengeStartCount: 183, connectedAt: new Date().toISOString() });
  return page("Twitch connected", `<h1>TWITCH CONNECTED</h1><p>Channel: ${user.display_name}</p><p>Subscription tracking is now armed.</p><p>The challenge remains anchored at 183.</p><p><a href="/">RETURN TO TRACKER</a></p>`);
}
export const config = { path: "/api/twitch/callback" };
