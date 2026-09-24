# Azzy Outlast Tracker — Netlify + Twitch

Outlast-style Twitch subscription challenge tracker.

## Netlify

- Publish directory: `public`
- Functions directory: `netlify/functions`
- Pushes to `main` redeploy automatically.
- Persistent state uses Netlify Blobs.

## Environment variables

Set these in Netlify Project configuration → Environment variables. They must be available to Functions:

- `ADMIN_KEY` — private key used by `/admin.html`
- `TWITCH_CLIENT_ID` — Twitch application client ID
- `TWITCH_CLIENT_SECRET` — Twitch application client secret
- `TWITCH_EVENTSUB_SECRET` — a long random secret you create and keep private
- `TWITCH_BROADCASTER_LOGIN` — the Twitch login of the channel owner, e.g. `5starazzy` (recommended)

After changing environment variables, trigger a new deploy because Netlify applies function environment values at deploy time.

## Twitch redirect URL

Set the Twitch application's OAuth redirect URL to:

`https://YOUR-NETLIFY-SITE/api/twitch/callback`

## Connecting Twitch

1. Open `/admin.html`.
2. Enter `ADMIN_KEY`.
3. Tap **GENERATE TWITCH AUTH LINK**.
4. Send the generated link to the broadcaster.
5. The broadcaster authorizes `channel:read:subscriptions`.
6. Twitch EventSub is registered for `channel.subscribe` and `channel.subscription.gift`.

The public page does not expose the admin key or Twitch credentials.
