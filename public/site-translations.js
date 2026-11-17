/* Cloud Collabo site-wide language layer. Original user text is never overwritten in D1. */
(()=>{'use strict';
const supported=new Set(['en','es','zh','hi']);
const picker=document.getElementById('language');
if(!picker)return;
const original=new WeakMap(),cache=new Map();
let generation=0,scheduled=false,busy=false;
const skip=new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','OPTION','CODE','PRE','SVG','TITLE']);
const known={
 es:{
 'Home':'Inicio','Explore Collabos':'Explorar Collabos','Start a Collabo':'Crear un Collabo',
 'Guest access: explore projects and prepare a Collabo without signing in. Sign up only when you submit or apply.':'Acceso de invitado: explora proyectos y prepara un Collabo sin iniciar sesión. Regístrate solo al publicar o solicitar participar.',
 'Sign in to continue':'Inicia sesión para continuar','Sign in to manage projects and collaborations.':'Inicia sesión para gestionar proyectos y colaboraciones.',
 'Sign in or create an account':'Iniciar sesión o crear una cuenta','INITIATOR':'INICIADOR',
 'You are initiating or managing a Collabo':'Estás iniciando o gestionando un Collabo',
 'Collabo History':'Historial de Collabos','Describe your Collabo and save your draft as you work.':'Describe tu Collabo y guarda el borrador mientras trabajas.',
 'Guests can complete the form; sign-up is required only when publishing.':'Los invitados pueden completar el formulario; solo es necesario registrarse al publicar.',
 'Project title':'Título del proyecto','Description':'Descripción','List your Collabo successfully':'Publica tu Collabo con éxito',
 'Project Projection':'Proyección del Collabo','Collabo Projection':'Proyección del Collabo',
 'Projected revenue':'Ingresos previstos','Projected expenses':'Gastos previstos','Projected profit':'Beneficio previsto',
 'Initiator and collaborator contributions':'Aportaciones del iniciador y colaboradores',
 'Project milestones':'Hitos del proyecto','Currency':'Moneda','Save':'Guardar','Submit':'Enviar','Continue':'Continuar','Cancel':'Cancelar'
 },
 zh:{
 'Home':'首页','Explore Collabos':'探索合作项目','Start a Collabo':'创建合作项目',
 'Guest access: explore projects and prepare a Collabo without signing in. Sign up only when you submit or apply.':'访客可浏览项目并准备合作方案，无需登录。提交或申请时才需要注册。',
 'Sign in to continue':'登录以继续','Sign in to manage projects and collaborations.':'登录以管理项目与合作。',
 'Sign in or create an account':'登录或创建账户','INITIATOR':'发起人','You are initiating or managing a Collabo':'您正在发起或管理合作项目',
 'Collabo History':'合作项目历史','Describe your Collabo and save your draft as you work.':'描述您的合作项目，并随时保存草稿。',
 'Guests can complete the form; sign-up is required only when publishing.':'访客可以填写表单，仅发布时需要注册。',
 'Project title':'项目标题','Description':'描述','List your Collabo successfully':'成功发布合作项目',
 'Project Projection':'合作项目预测','Collabo Projection':'合作项目预测',
 'Projected revenue':'预计收入','Projected expenses':'预计支出','Projected profit':'预计利润',
 'Initiator and collaborator contributions':'发起人与合作者的贡献','Project milestones':'项目里程碑',
 'Currency':'货币','Save':'保存','Submit':'提交','Continue':'继续','Cancel':'取消'
 },
 hi:{
 'Home':'होम','Explore Collabos':'सहयोग परियोजनाएँ खोजें','Start a Collabo':'सहयोग शुरू करें',
 'Guest access: explore projects and prepare a Collabo without signing in. Sign up only when you submit or apply.':'बिना साइन इन किए परियोजनाएँ देखें और सहयोग तैयार करें। जमा करने या आवेदन करने पर ही पंजीकरण करें।',
 'Sign in to continue':'आगे बढ़ने के लिए साइन इन करें','Sign in to manage projects and collaborations.':'परियोजनाओं और सहयोगों को प्रबंधित करने के लिए साइन इन करें।',
 'Sign in or create an account':'साइन इन करें या खाता बनाएँ','INITIATOR':'परियोजना आरंभकर्ता',
 'You are initiating or managing a Collabo':'आप एक सहयोग परियोजना शुरू या प्रबंधित कर रहे हैं',
 'Collabo History':'सहयोग इतिहास','Describe your Collabo and save your draft as you work.':'अपने सहयोग का विवरण दें और काम करते समय मसौदा सहेजें।',
 'Guests can complete the form; sign-up is required only when publishing.':'अतिथि फ़ॉर्म भर सकते हैं; पंजीकरण केवल प्रकाशित करते समय आवश्यक है।',
 'Project title':'परियोजना शीर्षक','Description':'विवरण','List your Collabo successfully':'अपना सहयोग सफलतापूर्वक प्रकाशित करें',
 'Project Projection':'सहयोग अनुमान','Collabo Projection':'सहयोग अनुमान',
 'Projected revenue':'अनुमानित आय','Projected expenses':'अनुमानित खर्च','Projected profit':'अनुमानित लाभ',
 'Initiator and collaborator contributions':'आरंभकर्ता और सहयोगियों का योगदान','Project milestones':'परियोजना के चरण',
 'Currency':'मुद्रा','Save':'सहेजें','Submit':'जमा करें','Continue':'जारी रखें','Cancel':'रद्द करें'
 }
};
function eligible(node){
 const el=node.parentElement;
 if(!el||skip.has(el.tagName)||el.closest('[contenteditable="true"],[data-no-translate],.cc-info,select,[data-i],[data-label]'))return false;
 const value=node.nodeValue||'';
 return value.trim().length>1 && /[A-Za-z]/.test(value) && value.length<=700;
}
const attrOriginal=new WeakMap();
function collect(){
 const nodes=[],attrs=[];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const n=walker.currentNode;
  if(!eligible(n))continue;
  if(!original.has(n))original.set(n,n.nodeValue);
  nodes.push(n);
 }
 for(const el of document.querySelectorAll('input[placeholder],textarea[placeholder],button[title],input[title],[aria-label]')){
  if(el.closest('[data-no-translate]')||el===picker)continue;
  for(const attr of ['placeholder','title','aria-label']){
   const value=el.getAttribute(attr);
   if(!value||!/[A-Za-z]/.test(value)||value.length>700)continue;
   let saved=attrOriginal.get(el);if(!saved){saved={};attrOriginal.set(el,saved)}
   if(!saved[attr])saved[attr]=value;
   attrs.push({el,attr,source:saved[attr]});
  }
 }
 return {nodes,attrs};
}
function lang(){return supported.has(picker.value)?picker.value:'en'}
function restore(){
 const {nodes,attrs}=collect();
 for(const n of nodes){const value=original.get(n);if(n.nodeValue!==value)n.nodeValue=value}
 for(const a of attrs)a.el.setAttribute(a.attr,a.source);
}
async function translateBatch(texts,target){
 const response=await fetch('/api/translate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({target,texts})});
 if(!response.ok)throw Error('Translator unavailable: '+response.status);
 const result=await response.json();
 if(!Array.isArray(result.translations)||result.translations.length!==texts.length)throw Error('Invalid translator response');
 return result.translations;
}
async function run(){
 if(busy){scheduled=true;return}
 busy=true;
 const version=++generation,target=lang();
 try{
  if(target==='en'){restore();return}
  const {nodes,attrs}=collect();
  const tasks=[
   ...nodes.map(n=>({source:original.get(n).trim(),apply:value=>{if(n.isConnected)n.nodeValue=original.get(n).replace(original.get(n).trim(),value)}})),
   ...attrs.map(a=>({source:a.source.trim(),apply:value=>{if(a.el.isConnected)a.el.setAttribute(a.attr,value)}}))
  ].filter(x=>x.source);
  const needed=[...new Set(tasks.map(x=>x.source))].filter(text=>!cache.has(target+'|'+text));
  // Apply built-in translations immediately, even if Workers AI is unavailable.
  for(const text of needed){if(known[target]?.[text])cache.set(target+'|'+text,known[target][text])}
  for(const task of tasks){const t=cache.get(target+'|'+task.source);if(t)task.apply(t)}
  const pending=needed.filter(text=>!cache.has(target+'|'+text));
  // Translate several batches concurrently instead of waiting for each network round-trip.
  // Keep concurrency bounded to avoid overwhelming the translation endpoint.
  const batches=[];for(let i=0;i<pending.length;i+=16)batches.push(pending.slice(i,i+16));
  let cursor=0;
  const applyCached=()=>{
   if(target!==lang()||version!==generation)return;
   for(const task of tasks){const value=cache.get(target+'|'+task.source);if(value)task.apply(value)}
  };
  const worker=async()=>{
   while(cursor<batches.length){
    if(target!==lang()||version!==generation)return;
    const batch=batches[cursor++];
    try{
     const translated=await translateBatch(batch,target);
     if(target!==lang()||version!==generation)return;
     translated.forEach((t,j)=>{if(typeof t==='string'&&t.trim())cache.set(target+'|'+batch[j],t)});
     applyCached();
    }catch(error){console.warn('Cloud Collabo translator:',error);return}
   }
  };
  await Promise.all(Array.from({length:Math.min(3,batches.length)},()=>worker()));
 }finally{
  busy=false;
  if(scheduled){scheduled=false;setTimeout(run,100)}
 }
}
function schedule(){
 if(scheduled)return;
 scheduled=true;
 setTimeout(()=>{scheduled=false;run()},180);
}
picker.addEventListener('change',()=>{generation++;restore();schedule()});
const observer=new MutationObserver(records=>{
 if(lang()==='en')return;
 if(records.some(r=>r.type==='childList'&&r.addedNodes.length))schedule();
});
observer.observe(document.body,{childList:true,subtree:true});
schedule();
})();
