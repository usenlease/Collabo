/* Cloud Collabo user notifications */
(function(){
 const bell=document.getElementById('cc-notification-bell'),panel=document.getElementById('cc-notification-panel'),count=document.getElementById('cc-notification-count'),list=document.getElementById('cc-notification-list');
 if(!bell||!panel)return;
 const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let items=[];
 async function request(path,options){
  const token=await window.cloudCollaboGetToken?.();
  if(!token)throw Error('Sign in to view notifications');
  const response=await fetch('/api'+path,{...options,headers:{Authorization:'Bearer '+token}});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Notifications unavailable');
  return data;
 }
 async function refresh(){
  if(!window.cloudCollaboIsSignedIn?.()){count.textContent='0';list.textContent='Sign in to see your notifications.';return;}
  try{
   const data=await request('/notifications');
   items=data.notifications||[];
   count.textContent=String(data.unread||0);
   count.style.display=data.unread?'inline':'none';
   list.innerHTML=items.length?items.map(n=>'<button type="button" data-notification="'+escapeHtml(n.id)+'" style="display:block;width:100%;text-align:left;margin:6px 0;padding:10px;border-radius:8px;background:'+(n.read_at?'#f4f6f5':'#fff6cc')+'"><strong>'+escapeHtml(n.title)+'</strong><span style="display:block;font-size:13px">'+escapeHtml(n.message)+'</span></button>').join(''):'No notifications yet.';
  }catch(e){list.textContent=e.message}
 }
 bell.addEventListener('click',()=>{panel.hidden=!panel.hidden;bell.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)refresh()});
 list.addEventListener('click',async e=>{
  const button=e.target.closest('[data-notification]');if(!button)return;
  const n=items.find(x=>x.id===button.dataset.notification);if(!n)return;
  try{await request('/notifications/'+encodeURIComponent(n.id)+'/read',{method:'POST'});}catch(e){list.textContent=e.message;return}
  panel.hidden=true;bell.setAttribute('aria-expanded','false');
  if(/^#project\/[a-f0-9-]{36}$/.test(n.link||''))location.hash=n.link.slice(1);
  await refresh();
 });
 window.addEventListener('cloudcollabo-auth-changed',refresh);
 refresh();setInterval(()=>{if(!document.hidden)refresh()},30000);
})();
