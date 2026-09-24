async function twitchFetch(url,options={}){const r=await fetch(url,options);const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}};return {r,data}}
export async function onRequestGet({request,env}){
  const u=new URL(request.url), code=u.searchParams.get('code'), state=u.searchParams.get('state');
  if(!code||!state)return new Response('Missing OAuth code/state',{status:400});
  if(!env.TRACKER_KV||!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET)return new Response('Twitch/KV configuration missing',{status:503});
  const stateKey='oauth_state:'+state;
  if(await env.TRACKER_KV.get(stateKey)!=='1')return new Response('Invalid or expired authorization link',{status:400});
  await env.TRACKER_KV.delete(stateKey);
  const redirectUri=new URL('/api/twitch/callback',request.url).toString();
  const tokenBody=new URLSearchParams({client_id:env.TWITCH_CLIENT_ID,client_secret:env.TWITCH_CLIENT_SECRET,code,grant_type:'authorization_code',redirect_uri:redirectUri});
  const tok=await twitchFetch('https://id.twitch.tv/oauth2/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:tokenBody});
  if(!tok.r.ok||!tok.data.access_token)return new Response('Twitch token exchange failed: '+JSON.stringify(tok.data),{status:502});
  const access=tok.data.access_token, refresh=tok.data.refresh_token;
  const users=await twitchFetch('https://api.twitch.tv/helix/users',{headers:{'Client-ID':env.TWITCH_CLIENT_ID,'Authorization':'Bearer '+access}});
  const user=users.data?.data?.[0];
  if(!users.r.ok||!user)return new Response('Could not identify the authorized Twitch account',{status:502});
  const wanted=(env.TWITCH_BROADCASTER_LOGIN||'').toLowerCase().replace(/^@/,'');
  if(wanted && user.login.toLowerCase()!==wanted)return new Response('Wrong Twitch account. Please authorize the channel owner account.',{status:403});
  const callback=new URL('/api/twitch/webhook',request.url).toString();
  if(!env.TWITCH_EVENTSUB_SECRET)return new Response('TWITCH_EVENTSUB_SECRET is not configured',{status:503});
  const eventTypes=['channel.subscribe','channel.subscription.gift'];
  const results=[];
  for(const type of eventTypes){
    const body={type,version:'1',condition:{broadcaster_user_id:user.id},transport:{method:'webhook',callback,secret:env.TWITCH_EVENTSUB_SECRET}};
    const sub=await twitchFetch('https://api.twitch.tv/helix/eventsub/subscriptions',{method:'POST',headers:{'Client-ID':env.TWITCH_CLIENT_ID,'Authorization':'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify(body)});
    results.push({type,status:sub.r.status,data:sub.data});
    if(!sub.r.ok && sub.r.status!==409)return new Response('EventSub registration failed for '+type+': '+JSON.stringify(sub.data),{status:502});
  }
  await env.TRACKER_KV.put('twitch_auth',JSON.stringify({userId:user.id,login:user.login,displayName:user.display_name,accessToken:access,refreshToken:refresh,expiresIn:tok.data.expires_in,connectedAt:new Date().toISOString()}));
  await env.TRACKER_KV.put('state',JSON.stringify({count:183,mode:'TWITCH',challengeBaseline:183,twitchBaselineSetAt:new Date().toISOString()}));
  return new Response('<!doctype html><meta name="viewport" content="width=device-width"><title>Connected</title><style>body{background:#020302;color:#a7ff91;font:18px monospace;padding:40px;text-align:center}h1{font-size:28px}a{color:#a7ff91}</style><h1>TWITCH CONNECTED</h1><p>Channel: '+user.display_name+'</p><p>Subscription tracking is now armed.</p><p>The challenge counter starts from 183.</p><p><a href="/">RETURN TO TRACKER</a></p>',{headers:{'content-type':'text/html; charset=utf-8'}});
}