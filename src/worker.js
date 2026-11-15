// Cloudflare Worker API for Cloud Collabo production foundation.
// Requires D1 binding DB and Clerk issuer/authorized-party secrets configured before use.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const b64url=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
async function authenticate(request,env){
 const token=/^Bearer (.+)$/i.exec(request.headers.get('authorization')||'')?.[1];
 if(!token)throw {status:401,message:'Sign in required'};
 if(!env.CLERK_ISSUER||!env.CLERK_AUTHORIZED_PARTY)throw {status:503,message:'Authentication not configured'};
 const parts=token.split('.');if(parts.length!==3)throw {status:401,message:'Invalid token'};
 let header,payload;try{header=JSON.parse(new TextDecoder().decode(b64url(parts[0])));payload=JSON.parse(new TextDecoder().decode(b64url(parts[1])))}catch{throw {status:401,message:'Invalid token'}}
 if(header.alg!=='RS256'||!header.kid)throw {status:401,message:'Unsupported token'};
 const issuer=env.CLERK_ISSUER.replace(/\/$/,'');
 if(payload.iss!==issuer||typeof payload.sub!=='string'||!payload.sub.startsWith('user_')||!Number.isFinite(payload.exp)||payload.exp<=Date.now()/1000||!Number.isFinite(payload.nbf)||payload.nbf>Date.now()/1000+60||payload.azp!==env.CLERK_AUTHORIZED_PARTY)throw {status:401,message:'Token validation failed'};
 const jwksUrl=issuer+'/.well-known/jwks.json';
 const response=await fetch(jwksUrl);if(!response.ok)throw {status:503,message:'Identity verification unavailable'};
 const keys=(await response.json()).keys||[];const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.use!=='enc');if(!jwk)throw {status:401,message:'Unrecognized signing key'};
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64url(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
 if(!valid)throw {status:401,message:'Invalid signature'};
 return payload.sub;
}
async function bodyJson(request){if(Number(request.headers.get('content-length')||0)>15000)throw {status:413,message:'Request too large'};let value;try{value=await request.json()}catch{throw {status:400,message:'Invalid JSON'}};return value}
async function getUser(env,id){return env.DB.prepare('SELECT clerk_user_id,role FROM users WHERE clerk_user_id=?').bind(id).first()}
async function requireUser(request,env){const id=await authenticate(request,env);const user=await getUser(env,id);if(!user)throw {status:403,message:'Complete account setup first'};return user}
async function admin(request,env){const u=await requireUser(request,env);if(u.role!=='admin')throw {status:403,message:'Administrator access required'};return u}
const validText=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;
export default {
 async fetch(request,env){
  const url=new URL(request.url),p=url.pathname,method=request.method;
  if(p==='/api/health')return json({ok:true,mode:'production-api-foundation'});
  if(!env.DB)return json({error:'Database not configured'},503);
  try{
   if(p==='/api/me'&&method==='POST'){
    const id=await authenticate(request,env);
    // No client-supplied role, email, or privileges are accepted.
    await env.DB.prepare("INSERT OR IGNORE INTO users(clerk_user_id,role) VALUES(?,'member')").bind(id).run();
    return json(await getUser(env,id));
   }
   if(p==='/api/collabos'&&method==='GET'){
    const rows=await env.DB.prepare("SELECT id,title,description,city,country,collaboration_type,created_at FROM collabos WHERE status='approved' ORDER BY created_at DESC LIMIT 100").all();
    return json({collabos:rows.results});
   }
   if(p==='/api/collabos'&&method==='POST'){
    const user=await requireUser(request,env),data=await bodyJson(request);
    if(!validText(data.title,120)||!validText(data.description,4000)||!validText(data.city,120)||!validText(data.country,120)||!['Local','Remote','Hybrid'].includes(data.collaboration_type))throw {status:400,message:'Missing or invalid project details'};
    const id=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO collabos(id,owner_id,title,description,city,country,collaboration_type,status) VALUES(?,?,?,?,?,?,?,'pending')").bind(id,user.clerk_user_id,data.title.trim(),data.description.trim(),data.city.trim(),data.country.trim(),data.collaboration_type).run();
    return json({id,status:'pending',message:'Submitted for administrator review'},201);
   }
   if(p==='/api/my-collabos'&&method==='GET'){
    const user=await requireUser(request,env);
    const rows=await env.DB.prepare('SELECT id,title,status,created_at FROM collabos WHERE owner_id=? ORDER BY created_at DESC').bind(user.clerk_user_id).all();
    return json({collabos:rows.results});
   }
   if(p==='/api/admin/pending'&&method==='GET'){
    await admin(request,env);
    const rows=await env.DB.prepare("SELECT id,title,description,city,country,owner_id,created_at FROM collabos WHERE status='pending' ORDER BY created_at").all();
    return json({collabos:rows.results});
   }
   const review=/^\/api\/admin\/collabos\/([a-f0-9-]{36})\/review$/.exec(p);
   if(review&&method==='POST'){
    const user=await admin(request,env),data=await bodyJson(request);
    if(!['approved','rejected'].includes(data.status))throw {status:400,message:'Invalid decision'};
    const result=await env.DB.prepare("UPDATE collabos SET status=?,reviewed_at=CURRENT_TIMESTAMP,reviewed_by=? WHERE id=? AND status='pending'").bind(data.status,user.clerk_user_id,review[1]).run();
    if(result.meta.changes!==1)throw {status:409,message:'Project already reviewed or not found'};
    await env.DB.prepare('INSERT INTO admin_audit(id,admin_id,collabo_id,action) VALUES(?,?,?,?)').bind(crypto.randomUUID(),user.clerk_user_id,review[1],data.status).run();
    return json({id:review[1],status:data.status});
   }
   return json({error:'Not found'},404);
  }catch(e){return json({error:e.message||'Request failed'},e.status||500)}
 }
};
