function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function randomHex(){const b=new Uint8Array(24);crypto.getRandomValues(b);return hex(b)}
export async function onRequestPost({request,env}){
  if(!env.ADMIN_KEY||request.headers.get('x-admin-key')!==env.ADMIN_KEY)return Response.json({error:'Unauthorized'},{status:401});
  if(!env.TRACKER_KV||!env.TWITCH_CLIENT_ID)return Response.json({error:'Twitch/ KV configuration missing'},{status:503});
  const state=await randomHex();
  await env.TRACKER_KV.put('oauth_state:'+state,'1',{expirationTtl:600});
  const url=new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id',env.TWITCH_CLIENT_ID);
  url.searchParams.set('redirect_uri',new URL('/api/twitch/callback',request.url).toString());
  url.searchParams.set('response_type','code');
  url.searchParams.set('scope','channel:read:subscriptions');
  url.searchParams.set('state',state);
  return Response.json({url:url.toString()});
}