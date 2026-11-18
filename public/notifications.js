/* Cloud Collabo user notifications */
(function(){
 const bell=document.getElementById('cc-notification-bell'),panel=document.getElementById('cc-notification-panel'),count=document.getElementById('cc-notification-count'),list=document.getElementById('cc-notification-list');
 if(!bell||!panel)return;
 const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let soundEnabled=localStorage.getItem('cc-notification-sound')==='on',audioContext=null;
 const soundToggle=document.createElement('button');soundToggle.type='button';soundToggle.style.cssText='display:block;margin:8px 0;padding:7px 10px;border:1px solid #d5c169;border-radius:7px;background:#fff8d8;color:#263322';
 const soundLabel=()=>soundToggle.textContent='Notification sound: '+(soundEnabled?'On 🔊':'Off 🔇');
 soundLabel();panel.querySelector('strong')?.insertAdjacentElement('afterend',soundToggle);
 soundToggle.addEventListener('click',()=>{
  soundEnabled=!soundEnabled;localStorage.setItem('cc-notification-sound',soundEnabled?'on':'off');
  if(soundEnabled){try{audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().then(playSound).catch(()=>{})}catch{}}
  soundLabel();
 });
 function playSound(){
  if(!soundEnabled||document.hidden||!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime;
  [660,880].forEach((hz,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),start=now+i*.17;o.frequency.value=hz;o.type='sine';g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.08,start+.02);g.gain.exponentialRampToValueAtTime(.0001,start+.15);o.connect(g);g.connect(audioContext.destination);o.start(start);o.stop(start+.16)});
 }
 let items=[];
 let knownUnreadIds=new Set(),initialized=false,refreshInFlight=false;
 const toast=document.createElement('div');toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.style.cssText='position:fixed;right:16px;top:90px;z-index:9999;max-width:min(350px,90vw);pointer-events:none';document.body.appendChild(toast);
 function navigateToNotification(n){
  const target=String(n.link||'');
  const match=/^#project\/([a-f0-9-]{36})(\/chat)?$/.exec(target);
  if(!match)return;
  const hash='#project/'+match[1];
  if(location.hash!==hash)location.hash=hash;
  let tries=0;
  const focus=()=>{
   const el=match[2]?(document.getElementById('collabo-team-chat')||document.querySelector('[data-team-chat]')||document.querySelector('.collabo-group-chat')):document.getElementById('applications');
   if(el){el.scrollIntoView({behavior:'smooth',block:'center'});return}
   if(++tries<40)setTimeout(focus,200);
  };
  setTimeout(focus,120);
 }
 function showToast(n){const el=document.createElement('div');el.style.cssText='background:#fff8d8;border:2px solid #d3a700;border-radius:12px;padding:12px;margin-bottom:8px;box-shadow:0 8px 24px #0002;color:#263322;pointer-events:auto';const title=document.createElement('strong');title.textContent=n.title;const msg=document.createElement('div');msg.textContent=n.message;const link=document.createElement('button');link.type='button';link.textContent='View application';link.style.cssText='display:block;margin-top:8px;padding:6px 10px;background:#166534;color:white;border:0;border-radius:7px';link.onclick=()=>{navigateToNotification(n);el.remove()};el.append(title,msg,link);toast.prepend(el);setTimeout(()=>el.remove(),9000)}
 async function request(path,options){
  const token=await window.cloudCollaboGetToken?.();
  if(!token)throw Error('Sign in to view notifications');
  const response=await fetch('/api'+path,{...options,headers:{Authorization:'Bearer '+token}});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Notifications unavailable');
  return data;
 }
 async function refresh(){
  if(refreshInFlight)return;
  if(!window.cloudCollaboIsSignedIn?.()){count.textContent='0';list.textContent='Sign in to see your notifications.';initialized=false;knownUnreadIds.clear();return;}
  refreshInFlight=true;
  try{
   const data=await request('/notifications');
   items=data.notifications||[];
   const unreadItems=items.filter(n=>!n.read_at);
   if(initialized){const fresh=unreadItems.filter(n=>!knownUnreadIds.has(n.id));fresh.slice(0,3).forEach(showToast);if(fresh.length)playSound();}
   knownUnreadIds=new Set(unreadItems.map(n=>n.id));initialized=true;
   count.textContent=String(data.unread||0);
   count.style.display=data.unread?'inline':'none';
   list.innerHTML=items.length?items.map(n=>'<button type="button" data-notification="'+escapeHtml(n.id)+'" style="display:block;width:100%;text-align:left;margin:6px 0;padding:10px;border-radius:8px;background:'+(n.read_at?'#f4f6f5':'#fff6cc')+'"><strong>'+escapeHtml(n.title)+'</strong><span style="display:block;font-size:13px">'+escapeHtml(n.message)+'</span></button>').join(''):'No notifications yet.';
  }catch(e){list.textContent=e.message}finally{refreshInFlight=false}
 }
 bell.addEventListener('click',()=>{panel.hidden=!panel.hidden;bell.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)refresh()});
 list.addEventListener('click',async e=>{
  const button=e.target.closest('[data-notification]');if(!button)return;
  const n=items.find(x=>x.id===button.dataset.notification);if(!n)return;
  try{await request('/notifications/'+encodeURIComponent(n.id)+'/read',{method:'POST'});}catch(e){list.textContent=e.message;return}
  panel.hidden=true;bell.setAttribute('aria-expanded','false');
  navigateToNotification(n);
  await refresh();
 });
 window.addEventListener('cloudcollabo-auth-changed',refresh);
 refresh();setInterval(()=>{if(!document.hidden)refresh()},5000);
 window.addEventListener('focus',refresh);
 window.addEventListener('cloudcollabo-notifications-refresh',refresh);
})();
