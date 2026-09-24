function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function randomHex(){const b=new Uint8Array(24);crypto.getRandomValues(b);return hex(b)}

async function makeAuthUrl(request, env){
  if(!env.TRACKER_KV || !env.TWITCH_CLIENT_ID) throw new Error('Twitch/KV configuration missing');
  const state=await randomHex();
  await env.TRACKER_KV.put('oauth_state:'+state,'1',{expirationTtl:600});
  const url=new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id',env.TWITCH_CLIENT_ID);
  url.searchParams.set('redirect_uri',new URL('/api/twitch/callback',request.url).toString());
  url.searchParams.set('response_type','code');
  url.searchParams.set('scope','channel:read:subscriptions');
  url.searchParams.set('state',state);
  return url.toString();
}

export async function onRequestGet({request,env}){
  try{
    const url=await makeAuthUrl(request,env);
    return Response.redirect(url,302);
  }catch(e){
    return new Response('Twitch connection is not configured yet: '+e.message,{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
  }
}

export async function onRequestPost({request,env}){
  if(!env.ADMIN_KEY || request.headers.get('x-admin-key')!==env.ADMIN_KEY)
    return Response.json({error:'Unauthorized'},{status:401});
  try{return Response.json({url:await makeAuthUrl(request,env)})}
  catch(e){return Response.json({error:e.message},{status:503})}
}
