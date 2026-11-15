// Cloud Collabo API foundation. D1 binding: DB. Clerk JWT verification via JWKS.
const productionIssuer = 'https://clerk.cloudcollabo.com';
const developmentIssuer = 'https://splendid-goblin-9695.clerk.accounts.dev';
const json = (value,status=200) => new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function base64url(value) {
 const s=value.replace(/-/g,'+').replace(/_/g,'/');
 return Uint8Array.from(atob(s.padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
}
async function identity(request, env) {
 const issuer = env.CLERK_ISSUER || productionIssuer;
 // Reject unrecognized issuers even if an environment variable is misconfigured.
 if(issuer !== productionIssuer && issuer !== developmentIssuer) return null;
 const token=/^Bearer (.+)$/i.exec(request.headers.get('authorization')||'')?.[1];
 if(!token) return null;
 const parts=token.split('.'); if(parts.length!==3) return null;
 let header,payload;
 try {header=JSON.parse(new TextDecoder().decode(base64url(parts[0])));payload=JSON.parse(new TextDecoder().decode(base64url(parts[1])));}catch{return null;}
 const now=Math.floor(Date.now()/1000);
 if(header.alg!=='RS256'||!header.kid||payload.iss!==issuer||!payload.sub||!payload.exp||payload.exp<=now||payload.nbf>now+60||payload.iat>now+60) return null;
 try {
  const response=await fetch(issuer+'/.well-known/jwks.json');
  if(!response.ok) return null;
  const jwks=await response.json(); const jwk=jwks.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig'));
  if(!jwk) return null;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const data=new TextEncoder().encode(parts[0]+'.'+parts[1]);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,base64url(parts[2]),data)?payload.sub:null;
 }catch{return null;}
}
async function body(request){try{return await request.json()}catch{return null}}
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if(!env.DB) return json({error:'Database not configured'},503);
  if(url.pathname==='/api/health'&&request.method==='GET') return json({status:'ok'});
  const user=await identity(request,env);
  if(!user) return json({error:'Sign in required'},401);
  try {
   if(url.pathname==='/api/projects'&&request.method==='GET'){
    const rows=await env.DB.prepare("SELECT id,title,description,category,location,collaboration_mode,status,created_at FROM projects WHERE status='open' ORDER BY created_at DESC LIMIT 100").all();
    return json({projects:rows.results});
   }
   if(url.pathname==='/api/projects'&&request.method==='POST'){
    const b=await body(request);if(!b||typeof b.title!=='string'||b.title.trim().length<3||b.title.length>160)return json({error:'Title must be 3–160 characters'},400);
    const mode=['Local','Remote','Hybrid'].includes(b.collaboration_mode)?b.collaboration_mode:'Hybrid';
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO projects(id,owner_clerk_id,title,description,category,location,collaboration_mode) VALUES(?,?,?,?,?,?,?)').bind(id,user,clean(b.title,160),clean(b.description,5000),clean(b.category,80)||'Other',clean(b.location,160),mode).run();
    return json({id},201);
   }
   const match=/^\/api\/projects\/([a-f0-9-]{36})$/.exec(url.pathname);
   if(match&&request.method==='GET'){
    const row=await env.DB.prepare('SELECT id,owner_clerk_id,title,description,category,location,collaboration_mode,status,created_at FROM projects WHERE id=?').bind(match[1]).first();
    if(!row)return json({error:'Not found'},404);
    return json({project:{...row,is_owner:row.owner_clerk_id===user,owner_clerk_id:undefined}});
   }
   if(match&&request.method==='PATCH'){
    const owner=await env.DB.prepare('SELECT owner_clerk_id FROM projects WHERE id=?').bind(match[1]).first();
    if(!owner)return json({error:'Not found'},404);
    if(owner.owner_clerk_id!==user)return json({error:'Forbidden'},403);
    const b=await body(request);
    if(!b||!['open','paused','closed'].includes(b.status))return json({error:'Invalid status'},400);
    await env.DB.prepare("UPDATE projects SET status=?,updated_at=datetime('now') WHERE id=?").bind(b.status,match[1]).run();
    return json({updated:true});
   }
   const apply=/^\/api\/projects\/([a-f0-9-]{36})\/applications$/.exec(url.pathname);
   if(apply&&request.method==='POST'){
    const project=await env.DB.prepare('SELECT owner_clerk_id,status FROM projects WHERE id=?').bind(apply[1]).first();
    if(!project)return json({error:'Not found'},404);
    if(project.owner_clerk_id===user||project.status!=='open')return json({error:'Applications unavailable'},403);
    const b=await body(request);const message=clean(b?.message,2000);
    try{await env.DB.prepare('INSERT INTO applications(id,project_id,applicant_clerk_id,message) VALUES(?,?,?,?)').bind(crypto.randomUUID(),apply[1],user,message).run();}
    catch{return json({error:'Already applied or application failed'},409)}
    return json({submitted:true},201);
   }
   if(apply&&request.method==='GET'){
    const owner=await env.DB.prepare('SELECT owner_clerk_id FROM projects WHERE id=?').bind(apply[1]).first();
    if(!owner)return json({error:'Not found'},404);
    if(owner.owner_clerk_id!==user)return json({error:'Forbidden'},403);
    const result=await env.DB.prepare('SELECT id,applicant_clerk_id,message,status,created_at FROM applications WHERE project_id=? ORDER BY created_at DESC LIMIT 100').bind(apply[1]).all();
    return json({applications:result.results});
   }
   // Ratings are allowed only between a project's initiator and an applicant.
   // Published aggregates never reveal Clerk user identifiers.
   const profile=/^\/api\/profiles\/([A-Za-z0-9_-]{1,128})\/ratings$/.exec(url.pathname);
   if(profile&&request.method==='GET'){
    const summary=await env.DB.prepare('SELECT COUNT(*) AS count, ROUND(AVG(stars),1) AS average FROM member_ratings WHERE rated_clerk_id=?').bind(profile[1]).first();
    const recent=await env.DB.prepare('SELECT stars,comment,created_at FROM member_ratings WHERE rated_clerk_id=? ORDER BY created_at DESC LIMIT 30').bind(profile[1]).all();
    return json({rating:{count:summary.count,average:summary.average,reviews:recent.results}});
   }
   const rating=/^\/api\/projects\/([a-f0-9-]{36})\/ratings$/.exec(url.pathname);
   if(rating&&request.method==='POST'){
    const b=await body(request);
    if(!Number.isInteger(b?.stars)||b.stars<1||b.stars>5)return json({error:'Select 1 to 5 stars'},400);
    const project=await env.DB.prepare('SELECT owner_clerk_id,status FROM projects WHERE id=?').bind(rating[1]).first();
    if(!project)return json({error:'Project not found'},404);
    if(project.status!=='closed')return json({error:'Ratings are available only after a project is closed'},409);
    const target=clean(b.target,128);
    if(!target||target===user)return json({error:'Invalid rating recipient'},400);
    const participant=await env.DB.prepare('SELECT id FROM applications WHERE project_id=? AND applicant_clerk_id=?').bind(rating[1],project.owner_clerk_id===user?target:user).first();
    if(!participant||!(project.owner_clerk_id===user||project.owner_clerk_id===target))return json({error:'Only project initiators and applicants may rate each other'},403);
    const exists=await env.DB.prepare('SELECT id FROM member_ratings WHERE project_id=? AND rater_clerk_id=? AND rated_clerk_id=?').bind(rating[1],user,target).first();
    if(exists)return json({error:'You already rated this participant for this project'},409);
    await env.DB.prepare('INSERT INTO member_ratings(id,project_id,rater_clerk_id,rated_clerk_id,stars,comment) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),rating[1],user,target,b.stars,clean(b.comment,500)).run();
    return json({submitted:true},201);
   }
   const applicants=/^\/api\/projects\/([a-f0-9-]{36})\/participants$/.exec(url.pathname);
   if(applicants&&request.method==='GET'){
    const p=await env.DB.prepare('SELECT owner_clerk_id,status FROM projects WHERE id=?').bind(applicants[1]).first();
    if(!p)return json({error:'Project not found'},404);
    const myApplication=await env.DB.prepare('SELECT id FROM applications WHERE project_id=? AND applicant_clerk_id=?').bind(applicants[1],user).first();
    if(p.owner_clerk_id!==user&&!myApplication)return json({error:'Forbidden'},403);
    const result=await env.DB.prepare('SELECT applicant_clerk_id AS id,status FROM applications WHERE project_id=?').bind(applicants[1]).all();
    const participants=p.owner_clerk_id===user?result.results.map(a=>({id:a.id,role:'Collaborator',status:a.status})): [{id:p.owner_clerk_id,role:'Initiator'}];
    for(const person of participants){
     const row=await env.DB.prepare('SELECT COUNT(*) AS count,ROUND(AVG(stars),1) AS average FROM member_ratings WHERE rated_clerk_id=?').bind(person.id).first();
     person.rating={count:row.count,average:row.average};
    }
    return json({participants,closed:p.status==='closed'});
   }
   return json({error:'Not found'},404);
  }catch(e){console.error('API failure',e);return json({error:'Server error'},500)}
 }
};
