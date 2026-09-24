# Azzy Outlast Tracker
Fresh build using the uploaded Azzy image. Start count 183, target 400.

Cloudflare Pages: deploy this repo, create a KV namespace, then Pages → Settings → Bindings → Add → KV namespace. Name the binding `TRACKER_KV`. Add an encrypted secret `ADMIN_KEY`. Redeploy. Open `/admin.html` for owner controls.

Twitch: `functions/api/twitch/webhook.js` is prepared for EventSub subscribe/gift notifications. It still requires the broadcaster's Twitch authorization and EventSub subscription setup. Add `TWITCH_EVENTSUB_SECRET` as an encrypted secret.
