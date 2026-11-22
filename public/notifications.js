/* Cloud Collabo user notifications */
(function(){
 const bell=document.getElementById('cc-notification-bell'),panel=document.getElementById('cc-notification-panel'),count=document.getElementById('cc-notification-count'),list=document.getElementById('cc-notification-list');
 if(!bell||!panel)return;
 const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let audioMode=localStorage.getItem('cc-notification-audio-mode')||(localStorage.getItem('cc-notification-sound')==='on'?'voice':'silent');
 if(!['voice','beep','silent'].includes(audioMode))audioMode='silent';
 let audioContext=null;
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 const controlBox=document.createElement('div');controlBox.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0';
 const modeLabel=document.createElement('label');modeLabel.textContent='Notification audio: ';modeLabel.style.cssText='font-weight:600;font-size:14px';
 const modeSelect=document.createElement('select');modeSelect.setAttribute('aria-label','Notification audio mode');
 modeSelect.style.cssText='padding:8px;border:1px solid #b7cbbf;border-radius:8px;background:white;color:#173a29';
 [['voice','Voice announcement'],['beep','Beep'],['silent','Silent']].forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;modeSelect.appendChild(o)});
 modeSelect.value=audioMode;modeLabel.appendChild(modeSelect);
 const voiceLabel=document.createElement('label');voiceLabel.textContent='Voice: ';voiceLabel.style.cssText='font-weight:600;font-size:14px';
 const voiceSelect=document.createElement('select');voiceSelect.setAttribute('aria-label','Notification announcement voice');
 voiceSelect.style.cssText=modeSelect.style.cssText;voiceLabel.appendChild(voiceSelect);
 const soundTest=document.createElement('button');soundTest.type='button';soundTest.textContent='▶ Test audio';soundTest.style.cssText='padding:8px 12px;border:1px solid #d5c169;border-radius:8px;background:#fff8d8;color:#263322;cursor:pointer';
 const soundStatus=document.createElement('span');soundStatus.setAttribute('role','status');soundStatus.style.cssText='display:block;font-size:12px;color:#48594b';
 controlBox.append(modeLabel,voiceLabel,soundTest,soundStatus);
 panel.querySelector('strong')?.insertAdjacentElement('afterend',controlBox);
 const savedVoice=localStorage.getItem('cc-notification-voice')||'preferred-british-male';
 function populateVoices(){
  const voices=('speechSynthesis' in window)?window.speechSynthesis.getVoices():[];
  const current=voiceSelect.value||savedVoice;
  voiceSelect.replaceChildren();
  const recommended=document.createElement('option');recommended.value='preferred-british-male';recommended.textContent='British male (preferred)';voiceSelect.appendChild(recommended);
  voices.filter(v=>/^en[-_]/i.test(v.lang)).forEach(v=>{const o=document.createElement('option');o.value=v.voiceURI;o.textContent=v.name+' ('+v.lang+')';voiceSelect.appendChild(o)});
  voiceSelect.value=Array.from(voiceSelect.options).some(o=>o.value===current)?current:'preferred-british-male';
 }
 populateVoices();
 if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',populateVoices);
 function updateControls(){voiceLabel.hidden=audioMode!=='voice';soundTest.disabled=audioMode==='silent';soundTest.style.opacity=audioMode==='silent'?'0.5':'1';}
 updateControls();
 async function unlockAudio(){
  if(!AudioContextClass)return false;
  try{audioContext=audioContext||new AudioContextClass();if(audioContext.state!=='running')await audioContext.resume();return audioContext.state==='running';}catch{return false;}
 }
 function playSound(force=false){
  if((audioMode!=='beep'&&!force)||document.hidden||!audioContext||audioContext.state!=='running')return false;
  const now=audioContext.currentTime;
  [660,880].forEach((hz,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),start=now+i*.17;o.frequency.value=hz;o.type='sine';g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.12,start+.02);g.gain.exponentialRampToValueAtTime(.0001,start+.15);o.connect(g);g.connect(audioContext.destination);o.start(start);o.stop(start+.16)});
  return true;
 }
 function speakNotification(force=false){
  if((audioMode!=='voice'&&!force)||document.hidden)return false;
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return playSound(true);
  try{
   const utterance=new SpeechSynthesisUtterance('You have a message in Cloud Collabo.');
   const voices=window.speechSynthesis.getVoices();
   let selected=voices.find(v=>v.voiceURI===voiceSelect.value);
   if(!selected){const british=voices.filter(v=>/^en[-_]GB$/i.test(v.lang));selected=british.find(v=>/daniel|george|oliver|arthur|ryan|alfie|male/i.test(v.name))||british[0];}
   if(selected)utterance.voice=selected;
   utterance.lang=selected?.lang||'en-GB';utterance.rate=0.95;utterance.volume=1;
   utterance.onerror=()=>{if(!document.hidden)playSound(true)};
   window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);
   return true;
  }catch{return playSound(true);}
 }
 function announce(){if(audioMode==='voice')return speakNotification();if(audioMode==='beep')return playSound();return false;}
 async function testSound(){
  if(audioMode==='silent')return;
  await unlockAudio();
  const played=audioMode==='voice'?speakNotification():playSound();
  soundStatus.textContent=played?'Playing '+(audioMode==='voice'?'voice announcement':'beep')+'.':'Audio unavailable. Check volume or tap again.';
 }
 modeSelect.addEventListener('change',()=>{audioMode=modeSelect.value;localStorage.setItem('cc-notification-audio-mode',audioMode);localStorage.setItem('cc-notification-sound',audioMode==='silent'?'off':'on');updateControls();if(audioMode==='silent'&&'speechSynthesis' in window)window.speechSynthesis.cancel();soundStatus.textContent='Preference saved on this device.';if(audioMode!=='silent')void testSound();});
 voiceSelect.addEventListener('change',()=>{localStorage.setItem('cc-notification-voice',voiceSelect.value);soundStatus.textContent='Voice preference saved on this device.';});
 soundTest.addEventListener('click',testSound);
 const activateAudio=()=>{if(audioMode!=='silent')void unlockAudio();};
 document.addEventListener('pointerdown',activateAudio,{capture:true});
 document.addEventListener('keydown',activateAudio,{capture:true});
  let items=[];
 let knownUnreadIds=new Set(),initialized=false,refreshInFlight=false;
 const toast=document.createElement('div');toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.style.cssText='position:fixed;right:16px;top:90px;z-index:9999;max-width:min(350px,90vw);pointer-events:none';document.body.appendChild(toast);
 function navigateToNotification(n){
  const target=String(n.link||'');
  const match=/^#project\/([a-f0-9-]{36})(?:\/chat(?:\/([a-f0-9-]{36}))?)?$/.exec(target);
  if(!match){if(target.startsWith('#'))location.hash=target;return}
  const hash='#project/'+match[1];
  if(match[2]!==undefined){
   sessionStorage.setItem('cc-pending-chat-target',JSON.stringify({projectId:match[1],messageId:match[2]||null}));
  }
  closePanel();
  if(location.hash!==hash)location.hash=hash;
  else window.dispatchEvent(new Event('hashchange'));
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
   if(initialized){const fresh=unreadItems.filter(n=>!knownUnreadIds.has(n.id));fresh.slice(0,3).forEach(showToast);if(fresh.length)announce();}
   knownUnreadIds=new Set(unreadItems.map(n=>n.id));initialized=true;
   count.textContent=String(data.unread||0);
   count.style.display=data.unread?'inline':'none';
   list.innerHTML=items.length?items.map(n=>'<button type="button" data-notification="'+escapeHtml(n.id)+'" style="display:block;width:100%;text-align:left;margin:6px 0;padding:10px;border-radius:8px;background:'+(n.read_at?'#f4f6f5':'#fff6cc')+'"><strong>'+escapeHtml(n.title)+'</strong><span style="display:block;font-size:14.95px">'+escapeHtml(n.message)+'</span></button>').join(''):'No notifications yet.';
  }catch(e){list.textContent=e.message}finally{refreshInFlight=false}
 }
 function closePanel(){panel.hidden=true;bell.setAttribute('aria-expanded','false')}
 function positionPanel(){
  panel.style.maxWidth='calc(100vw - 24px)';
  panel.style.boxSizing='border-box';
  const bounds=panel.getBoundingClientRect();
  if(bounds.left<12)panel.style.transform='translateX('+(12-bounds.left)+'px)';
  else if(bounds.right>window.innerWidth-12)panel.style.transform='translateX(-'+(bounds.right-window.innerWidth+12)+'px)';
 }
 bell.addEventListener('click',()=>{panel.style.transform='';panel.hidden=!panel.hidden;bell.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){positionPanel();refresh()}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)closePanel()});
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!bell.contains(e.target))closePanel()});
 window.addEventListener('resize',()=>{if(!panel.hidden){panel.style.transform='';positionPanel()}});
 document.addEventListener('click',e=>{if(!panel.hidden&&e.target.closest('[role="dialog"],[data-clerk-modal]'))closePanel()},true);
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
