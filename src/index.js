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
   if(url.pathname==='/api/my-projects'&&request.method==='GET'){
    const rows=await env.DB.prepare("SELECT id,title,description,category,location,collaboration_mode,status,created_at,updated_at FROM projects WHERE owner_clerk_id=? ORDER BY created_at DESC LIMIT 200").bind(user).all();
    return json({projects:rows.results});
   }
   if(url.pathname==='/api/projects'&&request.method==='GET'){
    const rows=await env.DB.prepare("SELECT id,title,description,category,location,collaboration_mode,status,created_at FROM projects WHERE status='open' ORDER BY created_at DESC LIMIT 100").all();
    return json({projects:rows.results});
   }
   if(url.pathname==='/api/projects'&&request.method==='POST'){
    const b=await body(request);if(!b||typeof b.title!=='string'||b.title.trim().length<3||b.title.length>160)return json({error:'Title must be 3–160 characters'},400);
    const needs=Array.isArray(b.needs)?b.needs:[];if(needs.length<1||needs.length>10||needs.some(n=>!n||!clean(n.item_name,120)||!Number.isInteger(n.quantity)||n.quantity<1||n.quantity>10000))return json({error:'Add 1–10 collaborator or resource requirements'},400);
    const mode=['Local','Remote','Hybrid'].includes(b.collaboration_mode)?b.collaboration_mode:'Hybrid';
    const id=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO projects(id,owner_clerk_id,title,description,category,location,collaboration_mode) VALUES(?,?,?,?,?,?,?)').bind(id,user,clean(b.title,160),clean(b.description,5000),clean(b.category,80)||'Other',clean(b.location,160),mode).run();
    for(let i=0;i<needs.length;i++)await env.DB.prepare('INSERT INTO project_needs(id,project_id,position,item_name,quantity,details) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,i+1,clean(needs[i].item_name,120),needs[i].quantity,clean(needs[i].details,1000)).run();
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

   const needsRoute=/^\/api\/projects\/([a-f0-9-]{36})\/needs$/.exec(url.pathname);
   if(needsRoute&&request.method==='GET'){
    const p=await env.DB.prepare('SELECT id FROM projects WHERE id=?').bind(needsRoute[1]).first();
    if(!p)return json({error:'Project not found'},404);
    const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('project_needs','role_applications')").all();
    const names=new Set(tables.results.map(t=>t.name));
    if(!names.has('project_needs'))return json({needs:[],requirements_available:false});
    const sql=names.has('role_applications')?"SELECT n.id,n.item_name,n.quantity,n.details,COALESCE((SELECT SUM(a.offered_quantity) FROM role_applications a WHERE a.need_id=n.id AND a.status='approved'),0) AS approved FROM project_needs n WHERE n.project_id=? ORDER BY n.position":"SELECT n.id,n.item_name,n.quantity,n.details,0 AS approved FROM project_needs n WHERE n.project_id=? ORDER BY n.position";
    const needs=await env.DB.prepare(sql).bind(needsRoute[1]).all();
    return json({needs:needs.results,requirements_available:true});
   }
   const rolesRoute=/^\/api\/projects\/([a-f0-9-]{36})\/role-applications$/.exec(url.pathname);
   if(rolesRoute&&request.method==='POST'){
    const p=await env.DB.prepare('SELECT owner_clerk_id,status FROM projects WHERE id=?').bind(rolesRoute[1]).first();
    if(!p)return json({error:'Project not found'},404);
    if(p.owner_clerk_id===user||p.status!=='open')return json({error:'Applications unavailable'},403);
    const b=await body(request);
    const n=await env.DB.prepare('SELECT id,quantity FROM project_needs WHERE id=? AND project_id=?').bind(b?.need_id,rolesRoute[1]).first();
    if(!n)return json({error:'Choose a listed role or resource'},400);
    const qty=Number(b.offered_quantity),amount=Number(b.rate_amount);
    if(!Number.isInteger(qty)||qty<1||qty>n.quantity||!Number.isFinite(amount)||amount<0||!['hour','day','month','project','item'].includes(b.rate_period)||!['USD','KES','GBP','EUR','CAD','AUD','INR'].includes(b.currency)||!clean(b.experience,2000))return json({error:'Enter valid experience, quantity, currency and rate'},400);
    try{await env.DB.prepare('INSERT INTO role_applications(id,project_id,need_id,applicant_clerk_id,experience,offered_quantity,rate_amount,currency,rate_period,message) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),rolesRoute[1],n.id,user,clean(b.experience,2000),qty,amount,b.currency,b.rate_period,clean(b.message,2000)).run();}
    catch{return json({error:'You already applied for this role or the application failed'},409)}
    return json({submitted:true},201);
   }
   if(rolesRoute&&request.method==='GET'){
    const p=await env.DB.prepare('SELECT owner_clerk_id FROM projects WHERE id=?').bind(rolesRoute[1]).first();
    if(!p)return json({error:'Project not found'},404);
    const owner=p.owner_clerk_id===user;
    const ready=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('role_applications','project_needs')").all();
    if(ready.results.length<2)return json({applications:[],is_owner:owner,applications_available:false});
    const rows=await env.DB.prepare("SELECT a.id,a.need_id,n.item_name,a.applicant_clerk_id,a.experience,a.offered_quantity,a.rate_amount,a.currency,a.rate_period,a.message,a.status,a.created_at FROM role_applications a JOIN project_needs n ON n.id=a.need_id WHERE a.project_id=? AND (a.applicant_clerk_id=? OR ?=1) ORDER BY a.created_at DESC").bind(rolesRoute[1],user,owner?1:0).all();
    return json({applications:rows.results,is_owner:owner});
   }
   const decision=/^\/api\/projects\/([a-f0-9-]{36})\/role-applications\/([a-f0-9-]{36})$/.exec(url.pathname);
   if(decision&&request.method==='PATCH'){
    const p=await env.DB.prepare('SELECT owner_clerk_id FROM projects WHERE id=?').bind(decision[1]).first();
    if(!p||p.owner_clerk_id!==user)return json({error:'Only the Initiator can decide'},403);
    const b=await body(request);if(!['approved','declined'].includes(b?.status))return json({error:'Invalid decision'},400);
    const a=await env.DB.prepare("SELECT a.id,a.status,a.need_id,a.offered_quantity,n.quantity FROM role_applications a JOIN project_needs n ON n.id=a.need_id WHERE a.id=? AND a.project_id=?").bind(decision[2],decision[1]).first();
    if(!a||a.status!=='pending')return json({error:'Application is not pending'},409);
    if(b.status==='approved'){
     const filled=await env.DB.prepare("SELECT COALESCE(SUM(offered_quantity),0) AS total FROM role_applications WHERE need_id=? AND status='approved'").bind(a.need_id).first();
     if(filled.total+a.offered_quantity>a.quantity)return json({error:'Not enough remaining positions or items'},409);
    }
    const result=await env.DB.prepare("UPDATE role_applications SET status=?,updated_at=datetime('now') WHERE id=? AND status='pending'").bind(b.status,a.id).run();
    if(!result.meta.changes)return json({error:'Application already decided'},409);
    return json({updated:true,status:b.status});
   }
   const chat=/^\/api\/projects\/([a-f0-9-]{36})\/team-messages$/.exec(url.pathname);
   if(chat&&(request.method==='GET'||request.method==='POST')){
    const p=await env.DB.prepare('SELECT owner_clerk_id FROM projects WHERE id=?').bind(chat[1]).first();
    if(!p)return json({error:'Project not found'},404);
    if(p.owner_clerk_id!==user){
     const roleTable=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='role_applications'").first();
     if(!roleTable)return json({error:'Team chat is temporarily unavailable while the database is being set up',code:'CHAT_SETUP_REQUIRED'},503);
     const member=await env.DB.prepare("SELECT id FROM role_applications WHERE project_id=? AND applicant_clerk_id=? AND status='approved' LIMIT 1").bind(chat[1],user).first();
     if(!member)return json({error:'Only approved collaborators can enter team chat'},403);
    }
    const chatTable=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='project_team_messages'").first();
    if(!chatTable)return json({error:'Team chat is temporarily unavailable while the database is being set up',code:'CHAT_SETUP_REQUIRED'},503);
    if(request.method==='GET'){
     const rows=await env.DB.prepare('SELECT id,sender_clerk_id,body,created_at FROM project_team_messages WHERE project_id=? ORDER BY created_at DESC LIMIT 100').bind(chat[1]).all();
     return json({messages:rows.results.reverse()});
    }
    const b=await body(request);if(typeof b?.message!=='string'||!b.message.trim()||b.message.length>2000)return json({error:'Message must be 1–2000 characters'},400);
    await env.DB.prepare('INSERT INTO project_team_messages(id,project_id,sender_clerk_id,body) VALUES(?,?,?,?)').bind(crypto.randomUUID(),chat[1],user,b.message.trim()).run();
    return json({sent:true},201);
   }
   return json({error:'Not found'},404);
  }catch(e){console.error('API failure',e);return json({error:'Server error'},500)}
 }
};
