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
 if(!el||skip.has(el.tagName)||el.closest('[contenteditable="true"],[data-no-translate],.cc-info'))return false;
 if(el.closest('select')||el.closest('[data-i], [data-label]'))return false;
 const t=node.nodeValue||'';
 return t.trim().length>1 && /[A-Za-z]/.test(t) && t.length<700;
}
function walk(){
 const nodes=[];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode;
  if(!eligible(node))continue;
  if(!original.has(node))original.set(node,node.nodeValue);
  nodes.push(node);
 }
 return nodes;
}
function lang(){const v=picker.value;return supported.has(v)?v:'en'}
function restore(){for(const n of walk()){const v=original.get(n);if(n.nodeValue!==v)n.nodeValue=v}}
async function translateBatch(texts,target){
 const key=target+'|'+JSON.stringify(texts);
 if(cache.has(key))return cache.get(key);
 const response=await fetch('/api/translate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({target,texts})});
 if(!response.ok)throw Error('Translation unavailable');
 const data=await response.json();
 if(!Array.isArray(data.translations)||data.translations.length!==texts.length)throw Error('Invalid translation');
 cache.set(key,data.translations);
 return data.translations;
}
async function run(){
 if(busy){scheduled=true;return}
 busy=true;
 const current=++generation,target=lang();
 try{
  if(target==='en'){restore();return}
  const nodes=walk().filter(n=>n.isConnected);
  const missing=nodes.filter(n=>!cache.has(target+'|'+JSON.stringify([original.get(n).trim()])));
  for(let i=0;i<missing.length;i+=8){
   if(current!==generation||target!==lang())return;
   const group=missing.slice(i,i+8);
   const texts=group.map(n=>original.get(n).trim());
   const translations=new Array(texts.length);
   const unresolved=[];
   texts.forEach((t,j)=>{if(known[target]?.[t])translations[j]=known[target][t];else unresolved.push(j)});
   if(unresolved.length){
     try{
       const result=await translateBatch(unresolved.map(j=>texts[j]),target);
       unresolved.forEach((j,k)=>{translations[j]=result[k]});
     }catch(e){console.warn('Cloud Collabo translation:',e.message)}
   }
   if(target!==lang())return;
   group.forEach((node,j)=>{
     if(!node.isConnected||!translations[j])return;
     const source=original.get(node),trim=source.trim();
     node.nodeValue=source.replace(trim,translations[j]);
     cache.set(target+'|'+JSON.stringify([trim]),[translations[j]]);
   });
  }
  if(target===lang()){
   for(const n of nodes){
    const source=original.get(n),trim=source.trim();
    const translation=cache.get(target+'|'+JSON.stringify([trim]));
    if(translation&&n.isConnected)n.nodeValue=source.replace(trim,translation[0]);
   }
  }
 }finally{busy=false;if(scheduled){scheduled=false;queueMicrotask(run)}}
}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;run()},200)}
picker.addEventListener('change',()=>{generation++;restore();schedule()});
const observer=new MutationObserver(records=>{
 let changed=false;
 for(const r of records){
  if(r.type==='childList'&&r.addedNodes.length)changed=true;
  if(r.type==='characterData'&&r.target.parentElement&&!original.has(r.target))changed=true;
 }
 if(changed&&lang()!=='en')schedule();
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});
schedule();
})();