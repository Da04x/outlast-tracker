# Azzy Outlast Tracker
Fresh build using the uploaded Azzy image. Start count 183, target 400.

## Cloudflare
Deploy as a Cloudflare Pages project. The Wrangler file binds the KV namespace as `TRACKER_KV`. Add these encrypted secrets in Settings → Variables and Secrets: `ADMIN_KEY`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, and `TWITCH_EVENTSUB_SECRET`. Add `TWITCH_BROADCASTER_LOGIN` as a variable/secret with the channel login (for example `5starazzy`). Redeploy after changing configuration.

## Twitch connection
1. In the Twitch Developer Console, set the OAuth redirect URL to exactly `https://YOUR-SITE.pages.dev/api/twitch/callback` (use your real Cloudflare Pages hostname).
2. Keep the app confidential.
3. In `/admin.html`, enter the admin key and press **GENERATE TWITCH AUTH LINK**.
4. Send the one-time link to the broadcaster. They authorize `channel:read:subscriptions`.
5. The callback verifies the authorized Twitch login, stores the token in KV, and registers `channel.subscribe` and `channel.subscription.gift` EventSub webhooks.

The visual public website does not change. The first Twitch connection sets the challenge state to 183. New normal subs add 1; gifted-sub events add the event's `total`. Event IDs are de-duplicated for 24 hours.
