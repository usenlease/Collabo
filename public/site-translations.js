/* Cloud Collabo site-wide language layer. Original user text is never overwritten in D1. */
(()=>{'use strict';
const supported=new Set(['en','es','zh','hi']);
const picker=document.getElementById('language');
if(!picker)return;
const original=new WeakMap(),cache=new Map();
let generation=0,scheduled=false,busy=false;
const skip=new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','OPTION','CODE','PRE','SVG','TITLE']);
function eligible(node){
 const el=node.parentElement;
 if(!el||skip.has(el.tagName)||el.closest('[contenteditable="true"],[data-no-translate],.cc-info'))return false;
 if(el.closest('select')||el.closest('button[data-i], [data-i], [data-label]'))return false;
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
   try{
    const translations=await translateBatch(texts,target);
    if(target!==lang())return;
    group.forEach((node,j)=>{
     if(!node.isConnected)return;
     const source=original.get(node),trim=source.trim();
     if(trim===texts[j])node.nodeValue=source.replace(trim,translations[j]);
     cache.set(target+'|'+JSON.stringify([trim]),[translations[j]]);
    });
   }catch(e){console.warn('Cloud Collabo translation:',e.message);break}
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