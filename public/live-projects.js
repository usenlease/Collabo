/* Live Cloud Collabo marketplace. API-backed projects; no payment or admin claims. */
(()=>{'use strict';
async function requestStatusReason(action,title){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100000;display:grid;place-items:center;padding:16px';
  overlay.innerHTML='<form style="background:#fff;border-radius:12px;padding:20px;width:min(480px,100%);box-shadow:0 15px 40px #0003"><h3>Reason for '+action+'</h3><p>Explain why you are '+action+'ing '+esc(title)+'. All approved collaborators will receive this reason in their notifications.</p><textarea required minlength="5" maxlength="1000" rows="4" style="width:100%;box-sizing:border-box" placeholder="Enter the reason (at least 5 characters)"></textarea><div style="display:flex;gap:10px;margin-top:12px"><button type="submit">Confirm '+action+'</button><button type="button" data-cancel>Cancel</button></div></form>';
  document.body.appendChild(overlay);const form=overlay.querySelector('form'),input=form.querySelector('textarea');input.focus();
  const finish=value=>{overlay.remove();resolve(value)};
  form.querySelector('[data-cancel]').onclick=()=>finish(null);
  form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(value.length<5){input.setCustomValidity('Enter at least 5 characters');input.reportValidity();return}finish(value)};
  input.oninput=()=>input.setCustomValidity('');
 });
}
const main=document.querySelector('main'),home=main.innerHTML;let activePage=null;const draftKey='cc-collabo-draft-v2';
/* PR72 visual theme only: no routing, authentication or project behavior changes. */
const theme=document.createElement('style');
theme.textContent='body:has(.market){background:linear-gradient(135deg,#e9f3e9 0%,#f8f1e8 52%,#edf4ed 100%);background-attachment:fixed}.market{background:rgba(255,253,249,.88);border:1px solid #d9e5d8;border-top:4px solid #168444;border-radius:18px;box-shadow:0 12px 32px rgba(16,50,34,.08);padding:24px 26px 50px!important}.market nav{background:#edf5ed;border-radius:12px;padding:12px;border-bottom:2px solid #b91c1c}.market article{background:#fffdfa;box-shadow:0 4px 14px rgba(20,45,29,.055)}.market .needs-section{background:#f1f7f0}.market .role-banner.initiator{border-left:5px solid #1f2421}.market .role-banner.collaborator{border-left:5px solid #b91c1c}@media(max-width:650px){.market{margin:14px auto!important;padding:16px 12px 36px!important}}';
document.head.appendChild(theme);
const ownerCompactStyle=document.createElement('style');
ownerCompactStyle.textContent='.market .owner-controls{padding:12px 14px!important;margin:8px 0!important}.market .owner-controls h3{margin:0 0 8px!important}.market .owner-controls button{margin:4px 5px 4px 0!important}.market #published-pictures{padding:10px 14px!important;margin:8px 0!important}.market #published-pictures h3{margin:2px 0 8px!important}.market #published-pictures label{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:5px 0!important}.market #published-pictures select{max-width:150px}.market #published-pictures input[type=file]{max-width:300px}.market #published-pictures button{margin:4px 0!important}';
document.head.appendChild(ownerCompactStyle);
const compactApplicationStyle=document.createElement('style');
compactApplicationStyle.textContent=`
/* Compact collaborator application: roughly half the vertical footprint on tablets/desktop. */
.market #role-apply{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:16px;row-gap:8px;align-items:start;max-width:100%}
.market #role-apply>h3,.market #role-apply>#apply-feedback{grid-column:1/-1}
.market #role-apply>h3{margin:2px 0 3px!important}
.market #role-apply>label{margin:0!important;gap:3px!important;min-width:0}
.market #role-apply input,.market #role-apply select,.market #role-apply textarea{box-sizing:border-box;width:100%;max-width:none;min-height:38px;padding:7px 10px!important;margin:0!important}
.market #role-apply textarea{height:68px;min-height:68px;resize:vertical}
.market #role-apply small{font-size:12.65px;line-height:1.25}
.market #role-apply>button[type=submit]{grid-column:1/-1;justify-self:start;margin:3px 0 0!important}
.market #role-apply>#apply-feedback{margin:0!important}
@media(max-width:600px){.market #role-apply{grid-template-columns:1fr;row-gap:7px}.market #role-apply>h3,.market #role-apply>#apply-feedback,.market #role-apply>button[type=submit]{grid-column:1}.market #role-apply textarea{height:60px;min-height:60px}}
`;
document.head.appendChild(compactApplicationStyle);
const collaboProgressTrackStyle=document.createElement('style');
collaboProgressTrackStyle.textContent='.market .collabo-progress-compact h3{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.market .collabo-progress-current{font-size:13.8px;font-weight:500;color:white}.market .collabo-stage-track{position:relative;height:8px;background:#d4e5d7;border-radius:8px;margin:14px 16px 18px}.market .collabo-stage-fill{height:100%;background:#168444;border-radius:8px;transition:width .3s}.market .collabo-stage-dots{position:absolute;inset:-9px 0;display:flex;justify-content:space-between;align-items:flex-start}.market .collabo-stage-dots span{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#e2e8e3;border:2px solid #b5c4b9;color:#43584a;font-size:13.8px;font-weight:700}.market .collabo-stage-dots span.reached{background:#168444;border-color:#168444;color:white}.market .collabo-progress-step.is-current{outline:2px solid #168444;outline-offset:-2px}.market .collabo-progress-step.is-upcoming{opacity:.65}.market .collabo-progress-step.is-done{opacity:.9}';
// The title bar itself is a permanent red-to-yellow-to-green progression.
// The white stage pointer moves as approved collaborators join and results complete.
collaboProgressTrackStyle.textContent += `
.market .collabo-progress-compact h3{
 background:linear-gradient(90deg,#c62828 0%,#dc6d28 25%,#e6bf25 50%,#7da83b 75%,#168444 100%)!important;
 position:relative!important;padding-bottom:17px!important
}
.market .collabo-progress-compact h3::after{
 content:'';position:absolute;bottom:2px;left:var(--stage-position,0%);transform:translateX(-50%);
 border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:11px solid #fff;
 transition:left .35s ease
}
.market .collabo-progress-compact[data-stage="1"]{--stage-position:2%}
.market .collabo-progress-compact[data-stage="2"]{--stage-position:50%}
.market .collabo-progress-compact[data-stage="3"]{--stage-position:98%}
.market .collabo-progress-compact[data-stage="1"] .collabo-stage-dots span.reached{background:#c62828!important;border-color:#c62828!important}
.market .collabo-progress-compact[data-stage="2"] .collabo-stage-dots span.reached{background:#e6bf25!important;border-color:#e6bf25!important;color:#222!important}
.market .collabo-progress-compact[data-stage="3"] .collabo-stage-dots span.reached{background:#168444!important;border-color:#168444!important}
`;
document.head.appendChild(collaboProgressTrackStyle);
const shareAgreementStyle=document.createElement('style');
shareAgreementStyle.textContent='.market .share-agreement{margin:12px 0;border:2px solid #c9a341;border-radius:14px;overflow:hidden;background:#fffdf4}.market .share-agreement>summary{cursor:pointer;list-style:none;padding:14px 16px;background:linear-gradient(105deg,#681f74,#9b347c,#d99b35);color:white;font-weight:800;font-size:17px}.market .share-agreement>summary::after{content:" ▾";float:right}.market .share-agreement[open]>summary::after{content:" ▴"}.market .share-agreement-body{padding:14px}.market .share-agreement details{margin:7px 0;border:1px solid #e3d6b8;border-radius:9px}.market .share-agreement details>summary{cursor:pointer;padding:10px;background:#f7eed9;font-weight:700}.market .share-agreement table{width:100%;font-size:14.95px}.market .share-agreement th,.market .share-agreement td{padding:6px;text-align:left}.market .share-agreement input[type=number]{width:76px;max-width:100%;padding:6px}.market .share-agreement .share-total{font-weight:800;padding:10px;background:#f6f0dc}';
document.head.appendChild(shareAgreementStyle);
// Give project names and collaborator headings strong visual hierarchy on mobile, including guest previews.
const exploreHeadingStyle=document.createElement('style');
exploreHeadingStyle.textContent=`
@media (max-width:700px){
 .market #project-list>article>h3:first-child,
 .market #project-details>article>h3:first-child{
  display:block!important;background:linear-gradient(115deg,#f8eed7 0%,#f4e7c6 58%,#ecdbb2 100%)!important;
  color:#29251d!important;border-radius:12px!important;padding:13px 15px!important;
  margin:0 0 12px!important;font-size:clamp(19px,5vw,24px)!important;
  line-height:1.3!important;font-weight:800!important;letter-spacing:.1px;
  overflow-wrap:anywhere;box-shadow:0 4px 12px rgba(111,85,35,.12)
 }
 .market #project-details>article>h3:not(:first-child),
 .market #project-list>article>strong{
  display:block!important;background:#e9f6ee!important;color:#14623e!important;
  border-left:5px solid #1e9a66!important;border-radius:8px!important;
  padding:9px 12px!important;margin:12px 0 8px!important;font-weight:800!important
 }
}
`;
document.head.appendChild(exploreHeadingStyle);
const collaboSerialStyle=document.createElement('style');
collaboSerialStyle.textContent='.market .collabo-serial-tag{display:inline-block!important;padding:7px 12px!important;margin:6px 0 12px!important;background:#f4e7c6!important;color:#3e321a!important;border:1px solid #c9ab65!important;border-radius:8px!important;font-size:16.1px!important;font-weight:800!important;letter-spacing:.3px!important}';
document.head.appendChild(collaboSerialStyle);
const embeddedChatStyle=document.createElement('style');
embeddedChatStyle.textContent='.market #project-details>article #team-chat{margin:12px 0 0!important;padding:12px!important;background:#f7fbff;border:1px solid #a9cafa;border-radius:10px}.market #project-details>article #team-chat h3{margin:0 0 7px!important;color:#1557a0}.market #project-details>article #chat-messages{max-height:210px!important;overflow-y:auto;padding:5px 0}.market #project-details>article #chat-messages p{margin:4px 0!important;padding:6px 8px;background:white;border-radius:7px}.market #project-details>article #chat-form{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;margin:7px 0}.market #project-details>article #chat-form label{flex:1 1 260px;margin:0}.market #project-details>article #chat-form textarea{min-height:48px;height:54px;margin:4px 0}.market #project-details>article #chat-form button{margin:0}.market #project-details>article #chat-presence-dots{margin:6px 0!important}';
document.head.appendChild(embeddedChatStyle);
const compactProjectChatStyle=document.createElement('style');
compactProjectChatStyle.textContent=`
/* Recover whitespace in project details and group chat without hiding content. */
.market #project-details>article{padding:14px 16px!important}
.market #project-details>article>h3,.market #project-details>article>h4{margin:8px 0 5px!important}
.market #project-details>article>p{margin:5px 0!important;line-height:1.4!important}
.market #project-details>article #team-chat{margin:8px 0 0!important;padding:10px 12px!important}
.market #project-details>article #team-chat h3{margin:0 0 3px!important}
.market #project-details>article #chat-presence-count{margin:2px 0 5px!important;line-height:1.25!important}
.market #project-details>article #chat-presence-dots{margin:3px 0!important}
.market #project-details>article #chat-first,.market #project-details>article #chat-latest{padding:7px 10px!important;margin:2px 3px 5px 0!important;min-height:34px}
.market #project-details>article #chat-messages{max-height:190px!important;min-height:0!important;padding:7px!important;margin:4px 0!important;gap:5px!important}
.market #project-details>article #chat-messages p{padding:7px 10px!important;line-height:1.35!important}
.market #project-details>article #chat-form{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:8px!important;align-items:end!important;margin:5px 0!important}
.market #project-details>article #chat-form label{min-width:0;margin:0!important}
.market #project-details>article #chat-form textarea{min-height:38px!important;height:42px!important;resize:vertical;margin:2px 0 0!important;padding:7px 9px!important}
.market #project-details>article #chat-form button{min-height:40px!important;padding:8px 12px!important}
.market #project-details>article #chat-refresh{padding:6px 10px!important;margin:2px 0 0!important}
@media(max-width:600px){.market #project-details>article #chat-form{grid-template-columns:1fr}.market #project-details>article #chat-form button{justify-self:start}}
`;
document.head.appendChild(compactProjectChatStyle);
const leanApplicationsStyle=document.createElement('style');
leanApplicationsStyle.textContent='.market #applications{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:8px 0 16px}.market #applications article{min-width:0;margin:0!important;padding:11px 13px!important;border-radius:10px;overflow-wrap:anywhere}.market #applications article p{margin:5px 0!important;line-height:1.35!important;font-size:16.1px}.market #applications article button{margin:5px 5px 0 0!important;padding:6px 11px!important}.market #applications .application-title{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.market #applications .application-status{font-size:13.8px;padding:2px 7px;border-radius:20px;background:#e9f3eb}.market #project-details h3{margin:12px 0 7px!important}.market #project-details>article{margin:8px 0!important}.market .owner-controls{display:block}.market .owner-controls p{margin:5px 0!important;line-height:1.35}.market #published-pictures{margin:8px 0!important}@media(max-width:650px){.market #applications{grid-template-columns:1fr}.market #applications article{padding:10px 12px!important}}';
document.head.appendChild(leanApplicationsStyle);
const applicationStatusStyle=document.createElement('style');
applicationStatusStyle.textContent='.market #applications article[data-application-status="approved"]{border-left:5px solid #15803d!important;background:#f0fdf4!important}.market #applications article[data-application-status="pending"]{border-left:5px solid #ca8a04!important;background:#fffbeb!important}.market #applications article[data-application-status="declined"],.market #applications article[data-application-status="rejected"]{border-left:5px solid #dc2626!important;background:#fef2f2!important}.market #applications .application-status[data-status="approved"]{background:#dcfce7!important;color:#166534!important;font-weight:700}.market #applications .application-status[data-status="pending"]{background:#fef08a!important;color:#854d0e!important;font-weight:700}.market #applications .application-status[data-status="declined"],.market #applications .application-status[data-status="rejected"]{background:#fee2e2!important;color:#991b1b!important;font-weight:700}';
document.head.appendChild(applicationStatusStyle);
const myRoleStatusStyle=document.createElement('style');
myRoleStatusStyle.textContent='.market #my-applications{display:grid;gap:8px;margin:8px 0 14px}.market .my-role-status{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-radius:9px;border:1px solid #d8e5dc;padding:9px 12px}.market .my-role-status[data-status="approved"]{background:#f0fdf4;border-left:5px solid #15803d}.market .my-role-status[data-status="pending"]{background:#fffbeb;border-left:5px solid #d6a100}.market .my-role-status[data-status="declined"],.market .my-role-status[data-status="rejected"]{background:#fef2f2;border-left:5px solid #dc2626}.market .my-role-badge{border-radius:20px;padding:3px 11px;font-weight:700;font-size:14.95px}.market [data-status="approved"]>.my-role-badge{background:#dcfce7;color:#166534}.market [data-status="pending"]>.my-role-badge{background:#fef08a;color:#854d0e}.market [data-status="declined"]>.my-role-badge,.market [data-status="rejected"]>.my-role-badge{background:#fee2e2;color:#991b1b}';
document.head.appendChild(myRoleStatusStyle);
const compactStyle=document.createElement('style');
compactStyle.textContent='.market #project-details>article{padding:14px 18px!important;margin:10px 0!important}.market #project-details>article p{margin:5px 0!important;line-height:1.45}.market #project-details>article h3{margin:12px 0 7px}.market .collabo-progress-compact{margin:12px 0;padding:12px;border:1px solid #b9dfc0;border-radius:12px;max-width:none}.market .collabo-progress-compact h3{background:#168444;color:white;padding:9px 12px;border-radius:8px;margin:0 0 10px}.market .collabo-progress-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.market .collabo-progress-step{min-width:0;border-radius:10px;padding:12px;overflow-wrap:anywhere}.market .collabo-progress-step:nth-child(1){background:#fff0f0}.market .collabo-progress-step:nth-child(2){background:#fff7dc}.market .collabo-progress-step:nth-child(3){background:#e8f8e9}.market .collabo-progress-heading{display:flex;align-items:center;gap:7px;font-size:16.1px}.market .collabo-progress-number{display:grid;place-items:center;background:#168444;color:#fff;border-radius:50%;width:24px;height:24px;flex-shrink:0}.market .collabo-progress-step p{font-size:16.1px;line-height:1.45;margin:8px 0 0}.market #project-details>article .collabo-needs-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 16px}.market #project-details>article .collabo-needs-list p{margin:0!important;padding:7px 9px;background:#f3f8f3;border-radius:7px}@media(max-width:650px){.market .collabo-progress-grid,.market #project-details>article .collabo-needs-list{grid-template-columns:1fr}.market .collabo-progress-step{padding:10px}}';
document.head.appendChild(compactStyle);
const fulfillmentStyle=document.createElement('style');
fulfillmentStyle.textContent='.market #project-details>article .collabo-needs-list{gap:6px 9px!important;margin:6px 0!important}.market #project-details>article .need-fulfillment{padding:7px 10px!important;border-radius:8px;border:1px solid transparent;min-width:0;line-height:1.3;font-size:14.95px;overflow-wrap:anywhere}.market #project-details>article .need-filled{background:#dcfce7!important;border-color:#86d6a1;color:#14532d}.market #project-details>article .need-open{background:#fef9c3!important;border-color:#f5d96a;color:#713f12}.market #project-details>article .need-fulfillment-top{display:flex;align-items:baseline;justify-content:space-between;gap:5px;flex-wrap:wrap}.market #project-details>article .need-count{font-weight:700;white-space:nowrap;font-size:13.8px}.market #project-details>article .need-details{display:block;margin-top:2px;line-height:1.3}.market #project-details>article .collabo-needs-list+.team-chat{margin-top:7px!important}';
document.head.appendChild(fulfillmentStyle);
const projectionStyle=document.createElement('style');projectionStyle.textContent='.projection-panel{background:#f8fcf9;border:1px solid #cbded2;border-radius:14px;padding:18px;margin:16px 0;box-shadow:0 3px 12px #123e2a0d}.projection-summary{padding:12px;border-bottom:3px solid #168444}.projection-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.projection-metrics>div{background:#eaf4ff;padding:12px;border-radius:10px}.projection-metrics small{display:block;color:#3d5a6a}.projection-metrics strong{display:block;font-size:18px;color:#173b2e;margin-top:5px}.projection-scroll{overflow-x:auto}.projection-panel table{border-collapse:collapse;width:100%;min-width:550px}.projection-panel th,.projection-panel td{text-align:left;border-bottom:1px solid #d9e5dd;padding:10px;font-size:16.1px}.projection-panel th{background:#e9f3e9}.projection-panel form{display:grid;gap:8px}.projection-panel form label{max-width:650px}';document.head.appendChild(projectionStyle);
const style=document.createElement('style');style.textContent='.market{max-width:1080px;margin:30px auto;padding:0 20px 50px}.market nav{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:25px}.market button,.market input,.market select,.market textarea{font:inherit;padding:11px;border:1px solid #b8cfc1;border-radius:8px}.market button{cursor:pointer}.market .primary{background:#12643e;color:white}.market label{display:grid;gap:5px;margin:12px 0}.market input,.market textarea,.market select{width:100%;max-width:650px}.market article{border:1px solid #cde0d4;border-radius:12px;padding:18px;margin:12px 0}.market .muted{color:#52665c}.market .error{color:#a52222}.market .success{color:#14683b} .market .needs-section{padding:16px;border:1px solid #cde0d4;border-radius:12px;background:#f5faf6;margin:18px 0}.market .need-row{background:#fff;border:1px solid #d3e5d8;padding:12px;margin:12px 0;border-radius:10px}.market .picture-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:850px}.market .picture-slot{padding:12px;border:1px solid #cde0d4;border-radius:12px;background:#f7fbf8;min-width:0}.market .picture-slot img{width:100%;height:150px;object-fit:cover;border-radius:8px}.market .picture-slot .empty-picture{height:150px;display:grid;place-items:center;background:#eaf1ed;border:1px dashed #9ab5a4;border-radius:8px;color:#52665c}.market .picture-slot input{width:100%;font-size:14.95px}.market .picture-slot button{margin-top:8px;font-size:14.95px;padding:7px 10px}.market .picture-slot .remove-picture{color:#a52222;border-color:#e5b9b9}@media(max-width:650px){.market .picture-slots{grid-template-columns:1fr}} .market .image-preview{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.market .image-preview img{width:130px;height:100px;object-fit:cover;border-radius:8px}.market .history-shortcut{display:inline-block;margin-left:14px;vertical-align:middle;font-size:17.25px;font-weight:800;background:#facc15;color:#1f2937;border:2px solid #ca8a04;padding:8px 13px;box-shadow:0 2px 6px #0002}.market .history-shortcut:hover,.market .history-shortcut:focus-visible{background:#fde047;border-color:#a16207;outline-offset:3px}.market .role-banner{padding:15px 20px;border-radius:10px;color:#fff;font-size:17px;font-weight:800;letter-spacing:.3px;margin:0 0 20px}.market .role-banner.initiator{background:#b91c1c}.market .role-banner.collaborator{background:#15803d}.market .role-banner small{display:block;font-size:14.95px;font-weight:500;margin-top:4px}.market .role-banner.collaborator{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.market .collaborator-banner-copy{min-width:0}@media(max-width:600px){.market .role-banner.collaborator{align-items:flex-start}.market .collaborator-history-button{width:100%}}.market .collaborator-history-button{background:#eaf4ff;color:#14529a;border:2px solid #1673dc;font-weight:800;padding:11px 18px;box-shadow:0 2px 5px #0002}.market .collaborator-history-button:hover,.market .collaborator-history-button:focus-visible{background:#d2e8ff;outline-offset:3px}.market .role-banner.initiator{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.market .initiator-history-button{background:#eaf4ff;color:#14529a;border:2px solid #1673dc;font-weight:800;padding:11px 18px;box-shadow:0 2px 5px #0002}.market .initiator-history-button:hover,.market .initiator-history-button:focus-visible,.market .initiator-history-button[aria-current=page]{background:#b9dcff;border-color:#0956b8;box-shadow:0 0 0 3px #bfdbfe}.market .initiator-history-content{background:#eff7ff;border:2px solid #82bafa;border-radius:14px;padding:18px;box-shadow:0 4px 18px #1e40af16}@media(max-width:600px){.market .initiator-history-button{width:100%}}.market nav .map-nav-button{background:#fff!important;color:#166534!important;border:2px solid #cadfd0!important;font-weight:800!important;box-shadow:none!important}.market nav .map-nav-button[aria-current=page]{background:#c51c24!important;color:#fff!important;border-color:#9f1019!important}.market nav .map-nav-button:hover,.market nav .map-nav-button:focus-visible,.market nav .map-nav-button[aria-current=page]{background:#9f1019!important;color:#fff!important;box-shadow:0 0 0 3px #fecaca,0 3px 9px #7f1d1d44!important}.market .posting-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(285px,1fr);gap:28px;align-items:start}.market .posting-layout #project-form{min-width:0}.market .posting-guide{position:sticky;top:20px;border:1px solid #d3e5d8;border-radius:18px;padding:22px;background:linear-gradient(155deg,#f2faf4,#fff 65%);box-shadow:0 12px 34px #123e2a0d}.market .posting-guide h3{margin:12px 0;color:#174a31;font-size:22px}.market .posting-guide p{line-height:1.6}.market .guide-illustration{padding:18px 10px;border-radius:14px;background:linear-gradient(135deg,#d8f0df,#eff8f1);display:flex;justify-content:center;align-items:center;min-height:155px}.market .guide-illustration svg{max-width:100%;height:auto}.market .guide-steps{list-style:none;margin:18px 0;padding:0;counter-reset:guide}.market .guide-steps li{position:relative;padding:0 0 20px 46px;border-left:2px solid #c5e3cd;margin-left:15px;line-height:1.45}.market .guide-steps li:last-child{border-left-color:transparent;padding-bottom:0}.market .guide-steps li:before{counter-increment:guide;content:counter(guide);position:absolute;left:-17px;top:0;width:32px;height:32px;border-radius:50%;background:#157347;color:white;display:grid;place-items:center;font-weight:700}.market .guide-steps strong{display:block;color:#184e32}.market .guide-example{background:#fff;border:1px solid #d5e7d9;border-radius:12px;padding:15px;margin-top:16px}.market .guide-example small{color:#627568}.market .guide-progress{display:flex;gap:5px;margin-top:12px}.market .guide-progress span{flex:1;height:7px;background:#dce9df;border-radius:8px}.market .guide-progress span.done{background:#168448}@media(max-width:850px){.market .posting-layout{grid-template-columns:1fr}.market .posting-guide{position:static}.market .posting-layout #project-form{order:1}.market .posting-guide{order:2}}';document.head.appendChild(style);
const draftImageDb='cc-collabo-draft-images-v1';
function imageDb(){return new Promise((resolve,reject)=>{if(!window.indexedDB){reject(Error('Image draft storage unavailable'));return}const req=indexedDB.open(draftImageDb,1);req.onupgradeneeded=()=>req.result.createObjectStore('pictures');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function imageDraft(action,slot,file){const db=await imageDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('pictures',action==='read'?'readonly':'readwrite');const store=tx.objectStore('pictures');const req=action==='read'?store.get(slot):action==='delete'?store.delete(slot):store.put(file,slot);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
async function clearImageDraft(){await Promise.all([0,1,2].map(i=>imageDraft('delete',i).catch(()=>{})))}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function renderShareAgreement(project,container){
 const id=project.id;container.innerHTML='<details class="share-agreement"><summary>✦ Collabo Contribution & Profit-Sharing Agreement</summary><div class="share-agreement-body"><p>Loading participant agreement…</p></div></details>';
 const host=container.querySelector('.share-agreement-body');
 try{
  const data=await api('/projects/'+id+'/share-agreement');
  const groups=[{id:'initiator',title:'Initiator',people:[{id:data.initiator_id,contribution:'Initiator contribution',rate:0,unit:'fixed'}]},...(data.needs||[]).map(n=>({id:n.id,title:n.item_name,people:(data.applications||[]).filter(a=>a.need_id===n.id).map(a=>({id:a.applicant_clerk_id,contribution:(a.currency||'USD')+' '+Number(a.rate_amount||0).toLocaleString(),rate:Number(a.rate_amount||0),unit:'hour'}))}))];
  const unique=[...new Set(groups.flatMap(g=>g.people.map(p=>p.id)))];
  const shares={};unique.forEach(key=>shares[key]=data.shares?.[key]??0);
  const total=()=>unique.reduce((n,key)=>n+Number(shares[key]||0),0);
  const terms={};
  unique.forEach(key=>{
   const p=groups.flatMap(g=>g.people).find(x=>x.id===key);
   const saved=data.contribution_terms?.[key];
   terms[key]=saved&&['hour','day','fixed'].includes(saved.unit)?saved:{rate:p?.rate||0,unit:p?.unit||'fixed',quantity:p?.unit==='fixed'?1:0};
  });
  const editable=data.is_owner&&data.ready;
  const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const row=(p,g)=>'<tr><td>'+esc(data.participant_names?.[p.id]||'Name not available')+'</td><td><input aria-label="Agreed rate in USD" type="number" min="0" step="0.01" data-rate="'+esc(p.id)+'" value="'+esc(terms[p.id].rate)+'" '+(!editable?'disabled':'')+'></td><td><select aria-label="Rate unit" data-unit="'+esc(p.id)+'" '+(!editable?'disabled':'')+'><option value="hour" '+(terms[p.id].unit==='hour'?'selected':'')+'>Per hour</option><option value="day" '+(terms[p.id].unit==='day'?'selected':'')+'>Per day</option><option value="fixed" '+(terms[p.id].unit==='fixed'?'selected':'')+'>Fixed amount</option></select></td><td><input aria-label="Agreed hours or days" type="number" min="0" step="0.01" data-quantity="'+esc(p.id)+'" value="'+esc(terms[p.id].quantity)+'" '+(!editable||terms[p.id].unit==='fixed'?'disabled':'')+'></td><td data-contribution="'+esc(p.id)+'">'+money(terms[p.id].rate*terms[p.id].quantity)+'</td><td><input type="number" min="0" max="100" step="0.01" data-person="'+esc(p.id)+'" value="'+esc(shares[p.id])+'" '+(!editable?'disabled':'')+'></td></tr>';
  const table=groups.map(g=>'<details><summary>▾ '+esc(g.title)+' — '+g.people.length+' participant(s) · <span data-group="'+esc(g.id)+'">0%</span></summary><div style="overflow-x:auto"><table><thead><tr><th>Participant identity</th><th>Agreed rate (USD)</th><th>Rate type</th><th>Hours / Days</th><th>Total initial contribution (USD)</th><th>Final share %</th></tr></thead><tbody>'+g.people.map(p=>row(p,g)).join('')+'</tbody></table></div></details>').join('');
  host.innerHTML='<p class="muted">'+(data.ready?'All required roles are filled. Propose the agreed shares below.':'Agreement becomes editable once all required collaborator positions are approved.')+'</p><div style="overflow-x:auto"><table><thead><tr><th>Group</th><th>Participants</th><th>Total initial contribution (USD)</th><th>Total final agreed share</th></tr></thead><tbody>'+groups.map(g=>'<tr><td>'+esc(g.title)+'</td><td>'+g.people.length+'</td><td data-group-contribution="'+esc(g.id)+'">'+money(g.people.reduce((sum,p)=>sum+terms[p.id].rate*terms[p.id].quantity,0))+'</td><td data-summary="'+esc(g.id)+'">0%</td></tr>').join('')+'</tbody></table></div><h4>Expand a group to view participants</h4>'+table+'<div class="share-total" id="share-total">Total: 0% / 100%</div>'+(editable?'<button type="button" class="primary" id="save-share-agreement">Save proposed shares and contribution terms</button>':'')+'<p id="share-agreement-message" role="status" class="muted">Draft proposal only. Individual approvals and final locking will be added separately.</p>';
  function update(){for(const g of groups){const contribution=g.people.reduce((sum,p)=>sum+terms[p.id].rate*terms[p.id].quantity,0);host.querySelector('[data-group-contribution="'+g.id+'"]').textContent=money(contribution);const n=g.people.reduce((sum,p)=>sum+Number(shares[p.id]||0),0);host.querySelector('[data-summary="'+g.id+'"]').textContent=n.toFixed(2)+'%';host.querySelector('[data-group="'+g.id+'"]').textContent=n.toFixed(2)+'%'}const t=total();const el=host.querySelector('#share-total');el.textContent='Total: '+t.toFixed(2)+'% / 100%';el.style.color=Math.abs(t-100)<.00001?'#167a3c':'#b42318';const button=host.querySelector('#save-share-agreement');if(button)button.disabled=Math.abs(t-100)>.00001}
  host.querySelectorAll('[data-rate],[data-unit],[data-quantity]').forEach(input=>input.addEventListener('input',()=>{const id=input.dataset.rate||input.dataset.unit||input.dataset.quantity;const t=terms[id];if(input.dataset.rate)t.rate=Number(input.value);if(input.dataset.unit){t.unit=input.value;if(t.unit==='fixed')t.quantity=1;const quantity=host.querySelector('[data-quantity="'+CSS.escape(id)+'"]');quantity.disabled=t.unit==='fixed';quantity.value=t.quantity}if(input.dataset.quantity)t.quantity=Number(input.value);host.querySelectorAll('[data-contribution="'+CSS.escape(id)+'"]').forEach(el=>el.textContent=money(t.rate*t.quantity));update()}));
  host.querySelectorAll('[data-person]').forEach(input=>input.addEventListener('input',()=>{shares[input.dataset.person]=Number(input.value);update()}));update();
  const save=host.querySelector('#save-share-agreement');if(save)save.onclick=async()=>{save.disabled=true;try{await api('/projects/'+id+'/share-agreement',{method:'PUT',body:JSON.stringify({shares,contribution_terms:terms})});host.querySelector('#share-agreement-message').textContent='Draft saved. Participant approval is not yet enabled.'}catch(e){host.querySelector('#share-agreement-message').textContent=e.message}finally{update()}};
 }catch(e){host.innerHTML='<p class="muted">Agreement unavailable: '+esc(e.message)+'</p>'}
}

function renderCollaboProgress(project,needs){
 const requirements=(needs||[]).map(n=>n.item_name).filter(Boolean);
 const problem=project.description||project.title||'A project needs people and resources to move forward.';
 const help=requirements.length?'Needed: '+requirements.join(', ')+'.':'The initiator is identifying the resources and collaborators needed.';
 const lifecycle=String(project.lifecycle_stage||project.status||'').toLowerCase();
 const completed=['closed','completed','finished'].includes(lifecycle);
 const approved=(needs||[]).reduce((total,n)=>total+Math.max(0,Number(n.approved)||0),0);
 // Stage 1: initiator alone; stage 2: at least one approved collaborator; stage 3: completed project.
 const stage=completed?3:approved>0?2:1;
 const result=completed?'Project marked complete. Confirm actual deliverables and financial results with the project team.':'Target: '+(project.title||'successful project')+'. Final outcomes and financial results will be recorded after completion.';
 const steps=[['1','🌱','Initiator',problem],['2','🤝','Collaboration',help],['3','🌾','Results',result]];
 const percent=stage===1?0:stage===2?50:100;
 return '<section class="collabo-progress-compact" aria-label="Collabo Progress" data-stage="'+stage+'"><h3>Collabo Progress <span class="collabo-progress-current">Current stage: '+esc(steps[stage-1][2])+'</span></h3><div class="collabo-stage-track" role="progressbar" aria-label="Collabo completion stages" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'"><div class="collabo-stage-fill" style="width:'+percent+'%"></div><div class="collabo-stage-dots">'+steps.map((x,i)=>'<span class="'+(i+1<=stage?'reached':'')+'" aria-label="'+esc(x[2])+'">'+x[0]+'</span>').join('')+'</div></div><div class="collabo-progress-grid">'+steps.map((x,i)=>'<div class="collabo-progress-step '+(i+1===stage?'is-current':i+1<stage?'is-done':'is-upcoming')+'"><div class="collabo-progress-heading"><span class="collabo-progress-number">'+x[0]+'</span><span aria-hidden="true">'+x[1]+'</span><strong>'+x[2]+'</strong></div><p>'+esc(x[3])+'</p></div>').join('')+'</div></section>';
}

async function api(path,options={}){const token=await window.cloudCollaboGetToken?.();if(!token)throw Error('Sign in to continue.');const r=await fetch('/api'+path,{...options,headers:{'Authorization':'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});let data;try{data=await r.json()}catch{throw Error('Server returned an unexpected response')}if(!r.ok)throw Error(data.error||'Request failed');return data}
const roleBanner=(role)=>role==='initiator'?'<div class="role-banner initiator" role="status"><div class="initiator-banner-copy">INITIATOR <small>You are initiating or managing a Collabo</small></div><button type="button" data-route="history" class="initiator-history-button" aria-current="'+(activePage==='history'?'page':'false')+'">Collabo History</button></div>':role==='collaborator'?'<div class="role-banner collaborator" role="status"><div class="collaborator-banner-copy">COLLABORATOR <small>Discover and apply to join a Collabo</small></div><button type="button" data-route="collaborator-history" class="collaborator-history-button">Collaborator History</button></div>':'';const layout=(title,html,role='')=>{const guest=!window.cloudCollaboIsSignedIn?.();main.innerHTML='<section class="market"><nav><button data-route="home">Home</button><button data-route="explore">Explore Collabos</button><button data-route="map" class="map-nav-button" aria-label="Open worldwide Collabo map" aria-current="'+(activePage==='map'?'page':'false')+'">Map</button><button data-route="post">Start a Collabo</button></nav>'+(guest?'<p class="muted" role="status" data-guest-notice>Guest access: explore projects and prepare a Collabo without signing in. Sign up only when you submit or apply.</p>':'')+roleBanner(role)+'<h2>'+title+'</h2>'+html+'</section>';window.scrollTo(0,0)};
// Authentication can finish after the page first renders. Keep the guest notice in sync
// without re-rendering the form or resetting any in-progress Collabo draft.
const syncGuestNotice=()=>{const notice=main.querySelector('[data-guest-notice]');if(notice)notice.hidden=!!window.cloudCollaboIsSignedIn?.();};
window.addEventListener('focus',syncGuestNotice);
window.addEventListener('pageshow',syncGuestNotice);
setInterval(syncGuestNotice,1200);

async function showProjection(projectId){
 const signed=!!window.cloudCollaboIsSignedIn?.();
 layout('Collabo Projection','<div id="projection-workspace">Loading projection…</div>');
 const root=document.getElementById('projection-workspace');
 const money=(v,currency)=>currency+' '+Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
 try{
  const endpoint=signed?'/projects/'+projectId+'/projection':'/public/projects/'+projectId+'/projection';
  let data;if(signed){try{data=await api(endpoint)}catch(error){if(!/Only project participants/.test(error.message))throw error;data=await fetch('/api/public/projects/'+projectId+'/projection').then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Projection unavailable');return d})}}else{data=await fetch('/api'+endpoint).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Projection unavailable');return d})}
  const p=data.project,s=data.settings||{},people=data.participants||[],entries=data.entries||[],milestones=data.milestones||[],payments=data.payments||[],currency=s.currency||'USD';
  const totalValue=people.reduce((n,x)=>n+Number(x.contribution_value||0),0);
  const actualIncome=entries.filter(x=>x.entry_type==='income').reduce((n,x)=>n+Number(x.amount),0);
  const actualExpenses=entries.filter(x=>x.entry_type==='expense').reduce((n,x)=>n+Number(x.amount),0);
  const projectedProfit=Number(s.projected_revenue||0)-Number(s.projected_expenses||0);
  const actualProfit=actualIncome-actualExpenses,fee=Math.max(0,actualProfit)*.05,distributable=Math.max(0,actualProfit)-fee;
  const feeProjected=Math.max(0,projectedProfit)*.05;
  const shareTotal=people.reduce((n,x)=>n+Number(x.profit_share_percent||0),0);
  const simulationParticipants=people.map(x=>({name:x.display_name||'Participant',role:x.role_name||'Contributor',value:Math.max(0,Number(x.contribution_value)||0),agreed:x.profit_share_percent==null?null:Number(x.profit_share_percent)}));
  const simulate=(revenue,expenses,rate)=>{
   const profit=revenue-expenses,fee=Math.max(0,profit)*0.05,tax=Math.max(0,profit-fee)*rate/100,pool=Math.max(0,profit-fee-tax);
   const allAgreed=simulationParticipants.length>0&&simulationParticipants.every(x=>x.agreed!==null);
   const validAgreed=allAgreed&&Math.abs(simulationParticipants.reduce((a,x)=>a+x.agreed,0)-100)<0.01;
   const shares=simulationParticipants.map(x=>({name:x.name,role:x.role,value:x.value,pct:validAgreed?x.agreed:(totalValue>0?100*x.value/totalValue:0)}));
   return {profit,fee,tax,pool,shares,validAgreed,unallocated:pool*(1-shares.reduce((a,x)=>a+x.pct,0)/100)};
  };
  const scenarioSection=()=>{
   const assumedRevenue=Math.max(0,Number(s.projected_revenue)||0),assumedExpenses=Math.max(0,Number(s.projected_expenses)||0);
   return '<section class="projection-panel" id="collabo-simulator"><h3>Project-specific Collabo Simulation</h3><p>Live what-if estimates using '+simulationParticipants.length+' recorded participants and '+money(totalValue,currency)+' of valued contributions. Adjust the assumptions below without changing saved project records.</p><div class="projection-metrics"><label>Projected revenue ($)<input id="sim-revenue" type="number" min="0" step="0.01" value="'+assumedRevenue+'"></label><label>Projected expenses ($)<input id="sim-expenses" type="number" min="0" step="0.01" value="'+assumedExpenses+'"></label><label>Estimated tax rate (%)<input id="sim-tax" type="number" min="0" max="100" step="0.1" value="0"></label><label>Scenario<select id="sim-scenario"><option value="1">Base estimate</option><option value="0.8">Conservative (80% revenue)</option><option value="1.2">Optimistic (120% revenue)</option></select></label></div><div id="sim-output" aria-live="polite"></div><p class="muted">Estimates only. Taxes vary by jurisdiction and legal structure. Contributions are not automatically profits. Where negotiated profit shares do not total 100%, the simulation uses contribution-value weights provisionally.</p></section>';
  };

  const section=(name,inner)=>'<section class="projection-panel"><h3>'+name+'</h3>'+inner+'</section>';
  root.innerHTML='<div class="projection-summary"><h2>'+esc(p.title)+'</h2><p>Category: '+esc(p.category||'General')+' · Currency: '+esc(currency)+'</p><p class="muted">Projection is an estimate, not a guaranteed return. Contribution percentages are calculated from agreed values; negotiated profit shares may differ.</p></div>'+
  section('1. Collabo Projection','<div class="projection-metrics"><div><small>Projected revenue</small><strong>'+money(s.projected_revenue,currency)+'</strong></div><div><small>Projected expenses</small><strong>'+money(s.projected_expenses,currency)+'</strong></div><div><small>Projected profit</small><strong>'+money(projectedProfit,currency)+'</strong></div><div><small>Projected participant pool after 5% success fee</small><strong>'+money(Math.max(0,projectedProfit)-feeProjected,currency)+'</strong></div></div>')+
  scenarioSection()+
  section('2. Initiator and collaborator contributions','<p>Every participant, including the initiator, is valued on the same basis. The contribution share updates when new participants are added.</p><div class="projection-scroll"><table><thead><tr><th>Participant</th><th>Role</th><th>Contribution</th><th>Value</th><th>Value share</th><th>Agreed profit share</th></tr></thead><tbody>'+people.map(x=>'<tr><td>'+esc(x.display_name)+'</td><td>'+esc(x.role_name)+'</td><td>'+esc(x.contribution_type)+' — '+esc(x.contribution_details||'')+'</td><td>'+money(x.contribution_value,currency)+'</td><td>'+(totalValue?((Number(x.contribution_value)/totalValue)*100).toFixed(1):'0')+'%</td><td>'+(x.profit_share_percent==null?'Not agreed':Number(x.profit_share_percent)+'%')+'</td></tr>').join('')+'</tbody></table></div><p><strong>Total valued contributions:</strong> '+money(totalValue,currency)+' · <strong>Agreed profit shares:</strong> '+shareTotal.toFixed(1)+'% of 100%</p>')+
  section('3. Project milestones','<div>'+milestones.map(x=>'<article><strong>'+esc(x.title)+'</strong> · '+esc(x.stage)+'<p>'+esc(x.notes||'')+'</p></article>').join('')+(milestones.length?'':'<p>No milestones recorded yet.</p>')+'</div>')+
  (signed?section('4. Actual income and expenses','<div class="projection-metrics"><div><small>Income received</small><strong>'+money(actualIncome,currency)+'</strong></div><div><small>Expenses recorded</small><strong>'+money(actualExpenses,currency)+'</strong></div><div><small>Actual profit/loss</small><strong>'+money(actualProfit,currency)+'</strong></div><div><small>Estimated distributable profit after 5% fee</small><strong>'+money(distributable,currency)+'</strong></div></div><div class="projection-scroll"><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>'+entries.map(x=>'<tr><td>'+esc(x.entry_date)+'</td><td>'+esc(x.entry_type)+'</td><td>'+esc(x.category)+'</td><td>'+esc(x.description)+'</td><td>'+money(x.amount,currency)+'</td></tr>').join('')+'</tbody></table></div>')+
  section('5. Proposed distribution and recorded payouts','<p class="muted">Calculated shares are proposals, not proof of payment. A payout appears as recorded only when the initiator enters a payment reference.</p><div class="projection-scroll"><table><thead><tr><th>Participant</th><th>Projected share</th><th>Actual calculated share</th><th>Recorded payments</th></tr></thead><tbody>'+people.map(x=>{const share=Number(x.profit_share_percent||0)/100;const paid=payments.filter(y=>y.participant_id===x.id).reduce((n,y)=>n+Number(y.amount),0);return '<tr><td>'+esc(x.display_name)+'</td><td>'+money((Math.max(0,projectedProfit)-feeProjected)*share,currency)+'</td><td>'+money(distributable*share,currency)+'</td><td>'+money(paid,currency)+'</td></tr>'}).join('')+'</tbody></table></div>')+
  (signed?section('Nium payout plan — review only','<p>Cloud Collabo fee: 5% of positive actual profit. Nium is not connected; this does not send or hold funds.</p><button type="button" id="load-nium-plan">Calculate proposed payout plan</button><div id="nium-plan-result" role="status"></div>'):'')+
  (signed?section('Payment account setup — United States','<p>Set your preferred payment method after your Collabo agreement is accepted, before your first payout.</p><form id="payout-preference-form"><label>Receiving country<select name="country"><option value="US">United States</option></select></label><label>Preferred payment method<select name="method"><option value="direct_deposit">Bank direct deposit (ACH)</option><option value="check">Paper check by mail</option></select></label><p class="muted">For direct deposit, routing and account details will be collected securely by an approved payment provider after onboarding. For checks, a verified mailing address will be required. Do not enter banking information in this form.</p><button class="primary">Save payment preference</button><p id="payout-preference-feedback" role="status"></p></form>'):'')+
  section('6. Project closure','<p><strong>Financial status:</strong> '+esc(s.closure_status||'active')+'</p><p>Compare original estimates against actual results, confirm every contribution, agree profit shares and record payments before closing the project.</p>'):'<p class="muted">Actual receipts, expenses and payment references are private to approved project participants.</p>')+
  (data.is_owner?'<div id="projection-editor">'+
  section('Edit projection','<form id="projection-settings-form"><label>Currency (USD only)<input name="currency" value="USD" readonly required></label><label>Projected revenue<input name="projected_revenue" type="number" min="0" step="0.01" required value="'+Number(s.projected_revenue||0)+'"></label><label>Projected expenses<input name="projected_expenses" type="number" min="0" step="0.01" required value="'+Number(s.projected_expenses||0)+'"></label><label>Project status<select name="closure_status"><option value="active">Active</option><option value="review">Under final review</option><option value="closed">Closed — lock financial entries</option></select></label><button class="primary">Save projection</button></form>')+
  section('Add initiator or collaborator contribution','<form id="projection-participant-form"><label>Name<input name="display_name" required maxlength="120"></label><label>Role<input name="role_name" required placeholder="Initiator / Investor / Caterer / Farm manager"></label><label>Contribution type<input name="contribution_type" required placeholder="Land use / Capital / Labor / Equipment"></label><label>Contribution details<input name="contribution_details"></label><label>Agreed monetary value<input name="contribution_value" type="number" min="0" step="0.01" required></label><label>Agreed profit share % (optional)<input name="profit_share_percent" type="number" min="0" max="100" step="0.01"></label><button class="primary">Add contribution</button></form>')+
  section('Record actual income or expense','<form id="projection-entry-form"><label>Type<select name="entry_type"><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Category<input name="category" required placeholder="Seeds / Catering / Ticket sales / Transport"></label><label>Description<input name="description" required></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Date<input name="entry_date" type="date" required></label><button class="primary">Record entry</button></form>')+
  section('Add project milestone','<form id="projection-milestone-form"><label>Milestone<input name="title" required placeholder="Harvest complete / Venue booked"></label><label>Status<select name="stage"><option value="planned">Planned</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></label><label>Notes<input name="notes"></label><button class="primary">Add milestone</button></form>')+
  section('Record a completed participant payment','<form id="projection-payment-form"><label>Participant<select name="participant_id" required>'+people.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.display_name)+'</option>').join('')+'</select></label><label>Amount paid<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Payment reference<input name="reference" required placeholder="Bank or transfer confirmation"></label><button class="primary">Record payment</button></form>')+
  '<p id="projection-feedback" role="status"></p></div>':'');
  
  root.querySelector('#load-nium-plan')?.addEventListener('click',async()=>{
   const output=root.querySelector('#nium-plan-result');output.textContent='Calculating…';
   try{
    const plan=await api('/projects/'+projectId+'/payout-plan');
    const wrap=document.createElement('div'),summary=document.createElement('p');
    summary.textContent='Actual profit: '+money(plan.actual_profit,plan.currency)+' | Cloud Collabo 5%: '+money(plan.platform_fee,plan.currency)+' | Participant pool: '+money(plan.participant_pool,plan.currency);
    wrap.append(summary);
    for(const person of plan.recipients){const row=document.createElement('p');row.textContent=person.name+' ('+person.role+'): '+(person.proposed_amount===null?'Share not agreed':money(person.proposed_amount,plan.currency));wrap.append(row)}
    const note=document.createElement('p');note.textContent=plan.notice;wrap.append(note);output.replaceChildren(wrap);
   }catch(err){output.textContent=err.message}
  });
  const payoutForm=root.querySelector('#payout-preference-form');
  if(payoutForm){
   api('/me/payout-preference').then(pref=>{if(pref.method)payoutForm.elements.method.value=pref.method}).catch(()=>{});
   payoutForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const feedback=root.querySelector('#payout-preference-feedback');feedback.textContent='Saving…';
    try{const result=await api('/me/payout-preference',{method:'PUT',body:JSON.stringify({country:'US',method:payoutForm.elements.method.value})});feedback.textContent=result.message}
    catch(error){feedback.textContent=error.message}
   });
  }
  const sim=root.querySelector('#collabo-simulator');
  if(sim){
   const renderSim=()=>{
    const revenueInput=sim.querySelector('#sim-revenue');
    const expensesInput=sim.querySelector('#sim-expenses');
    const taxInput=sim.querySelector('#sim-tax');
    const output=sim.querySelector('#sim-output');
    const validateNonnegative=(input,label)=>{
     const raw=input.value.trim(),value=Number(raw);
     const invalid=raw===''||!Number.isFinite(value)||value<0||value>1e12;
     input.setCustomValidity(invalid?label+' must be a valid non-negative amount.':'');
     input.setAttribute('aria-invalid',String(invalid));
     return invalid;
    };
    const invalidRevenue=validateNonnegative(revenueInput,'Projected revenue');
    const invalidExpenses=validateNonnegative(expensesInput,'Projected expenses');
    const taxValue=Number(taxInput.value);
    const invalidTax=taxInput.value.trim()===''||!Number.isFinite(taxValue)||taxValue<0||taxValue>100;
    taxInput.setCustomValidity(invalidTax?'Estimated tax rate must be between 0 and 100.':'');
    taxInput.setAttribute('aria-invalid',String(invalidTax));
    let feedback=sim.querySelector('#sim-validation-message');
    if(!feedback){
     feedback=document.createElement('p');
     feedback.id='sim-validation-message';
     feedback.setAttribute('role','alert');
     feedback.style.cssText='color:#b91c1c;font-weight:600;margin:10px 0;';
     sim.querySelector('.projection-metrics').after(feedback);
    }
    const invalid=invalidRevenue||invalidExpenses||invalidTax;
    feedback.textContent=invalid?(invalidExpenses?'Projected expenses cannot be negative. Enter zero or a positive amount.':invalidRevenue?'Projected revenue must be zero or greater.':'Estimated tax rate must be between 0 and 100.'):'';
    if(invalid){output.innerHTML='';return;}
    const revenue=Number(revenueInput.value)*Number(sim.querySelector('#sim-scenario').value);
    const expenses=Number(expensesInput.value);
    const rate=taxValue;
    const result=simulate(revenue,expenses,rate);
    const rows=result.shares.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.role)+'</td><td>'+money(x.value,currency)+'</td><td>'+x.pct.toFixed(2)+'%</td><td>'+money(result.pool*x.pct/100,currency)+'</td></tr>').join('');
    sim.querySelector('#sim-output').innerHTML='<div class="projection-metrics"><div><small>Projected revenue</small><strong>'+money(revenue,currency)+'</strong></div><div><small>Projected expenses</small><strong>'+money(expenses,currency)+'</strong></div><div><small>Profit / loss</small><strong>'+money(result.profit,currency)+'</strong></div><div><small>5% fee (positive profit only)</small><strong>'+money(result.fee,currency)+'</strong></div><div><small>Estimated tax</small><strong>'+money(result.tax,currency)+'</strong></div><div><small>Estimated participant profit pool</small><strong>'+money(result.pool,currency)+'</strong></div></div><div class="projection-scroll"><table><thead><tr><th>Participant</th><th>Role</th><th>Contribution</th><th>Share</th><th>Projected profit</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+(simulationParticipants.length===0?'<p>No participant contributions recorded. Add initiator and collaborator contributions to calculate shares.</p>':'')+(!result.validAgreed?'<p class="muted">Provisional contribution-based distribution; negotiated shares not finalized.</p>':'');
   };
   sim.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',renderSim));
   renderSim();
  }
if(data.is_owner){
   root.querySelector('[name="closure_status"]').value=s.closure_status||'active';
   const date=root.querySelector('[name="entry_date"]');const today=new Date();date.value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
   for(const [formId,path,method] of [['projection-settings-form','settings','PUT'],['projection-participant-form','participants','POST'],['projection-entry-form','entries','POST'],['projection-milestone-form','milestones','POST'],['projection-payment-form','payments','POST']]){
    const form=root.querySelector('#'+formId);
    form.onsubmit=async event=>{
     event.preventDefault();const btn=form.querySelector('button'),feedback=root.querySelector('#projection-feedback');
     const values=Object.fromEntries(new FormData(form).entries());
     let inline=form.querySelector('.projection-inline-error');
     if(!inline){inline=document.createElement('p');inline.className='projection-inline-error';inline.setAttribute('role','alert');inline.setAttribute('tabindex','-1');inline.style.cssText='color:#b91c1c;font-weight:700;margin:10px 0';form.appendChild(inline)}
     inline.textContent='';
     btn.disabled=true;feedback.textContent='Saving…';
     try{await api('/projects/'+projectId+'/projection/'+path,{method,body:JSON.stringify(values)});await showProjection(projectId)}
     catch(error){inline.textContent=error.message||'Unable to save. Please check the entered values.';feedback.textContent='';btn.disabled=false;inline.focus()}
    };
   }
  }
 }catch(error){root.textContent=error.message}
}

async function route(){const page=location.hash.slice(1)||'home';const projectionPage=/^projection\/([a-f0-9-]{36})$/.exec(page);if(projectionPage){activePage=page;await showProjection(projectionPage[1]);return}if(page===activePage&&/^project\/[a-f0-9-]{36}$/.test(page)&&main.querySelector('#project-details')&&!main.querySelector('#project-details').textContent.includes('Loading…'))return;if(page===activePage&&((page==='post'&&main.querySelector('#project-form'))||((page==='explore'||page==='map')&&main.querySelector('#project-filter'))||(page==='home'&&main.querySelector('.hero'))))return;activePage=page;if(page==='home'){main.innerHTML=home;return}if(!window.cloudCollaboIsSignedIn?.() && !['post','explore','map'].includes(page) && !/^project\/[a-f0-9-]{36}$/.test(page)){layout('Sign in to continue','<p class="muted">Sign in to manage projects and collaborations.</p><button class="primary" id="market-sign-in" type="button">Sign in or create an account</button>');window.cloudCollaboPendingPage=page;document.getElementById('market-sign-in').onclick=()=>window.cloudCollaboSignIn?.();return}
if(!window.cloudCollaboIsSignedIn?.() && /^project\/[a-f0-9-]{36}$/.test(page)){layout('Collabo preview','<div id="public-project-details">Loading project preview…</div>','collaborator');try{const id=page.split('/')[1];const response=await fetch('/api/public/projects/'+id);const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to load preview');const p=data.project;document.getElementById('public-project-details').insertAdjacentHTML('beforebegin','<p><button type="button" data-route="projection/'+id+'" class="primary">View Collabo Projection</button></p>');document.getElementById('public-project-details').innerHTML='<article><h3>'+esc(p.title)+'</h3><p>'+esc(p.description)+'</p><p class="muted">'+esc(p.category)+' · '+esc(p.location)+' · '+esc(p.collaboration_mode)+'</p><h4>Collaborators and resources needed</h4><ul>'+(data.needs||[]).map(n=>'<li>'+esc(n.item_name)+' — '+esc(n.quantity)+' needed'+(n.details?' · '+esc(n.details):'')+'</li>').join('')+'</ul><button class="primary" id="preview-join" type="button">Sign up to apply</button></article>';document.getElementById('preview-join').onclick=()=>{window.cloudCollaboPendingPage=page;window.cloudCollaboSignUp?.()}}catch(err){document.getElementById('public-project-details').textContent=err.message}return}
if(page==='collaborator-history'){
layout('My Collaborator History','<p class="muted">Your applications and accepted Collabos, including ongoing, paused, completed, rejected and disputed work.</p><label>Filter<select id="collab-filter"><option value="all">All</option><option value="ongoing">Ongoing</option><option value="paused">Paused</option><option value="closed">Completed / closed</option><option value="rejected">Rejected</option><option value="disputed">Disputed</option><option value="pending">Awaiting decision</option></select></label><div id="collab-history-results" role="status">Loading…</div>','collaborator');
try{const data=await api('/my-collaborations');const rows=data.collaborations||[];const render=()=>{const filter=document.getElementById('collab-filter').value;const classify=p=>p.is_disputed?'disputed':p.application_status==='declined'?'rejected':p.application_status==='pending'?'pending':p.project_status==='paused'?'paused':p.lifecycle_stage==='closed'?'closed':p.lifecycle_stage==='ongoing'?'ongoing':'open';const chosen=rows.filter(p=>filter==='all'||classify(p)===filter);document.getElementById('collab-history-results').innerHTML='<p>'+chosen.length+' collaboration'+(chosen.length===1?'':'s')+'</p>'+chosen.map(p=>'<article'+(p.is_owner?' class="own-collabo" style="border:3px solid #1673dc;background:#eaf4ff;box-shadow:0 0 0 2px #d2e8ff"':'')+'><p class="collabo-serial-tag">Collabo ID: '+esc(p.collabo_number||'Pending')+'</p><h3>'+esc(p.title)+'</h3>'+(p.is_owner?'<p><strong style="display:inline-block;background:#1464c8;color:white;padding:7px 12px;border-radius:8px">You posted this</strong></p>':'')+'<p>'+esc(p.description)+'</p><p class="muted">'+esc(p.location)+'</p><p><strong>Status:</strong> '+esc(({closed:'Completed / closed',rejected:'Rejected',disputed:'Disputed',pending:'Awaiting decision',ongoing:'Ongoing',paused:'Paused',open:'Accepted / not started'})[classify(p)])+'</p><button data-project="'+esc(p.project_id)+'">View Collabo</button>'+(p.application_status==='approved'&&!p.is_disputed&&data.disputes_available?'<button class="report-dispute" data-application="'+esc(p.application_id)+'" type="button">Report dispute</button>':'')+'</article>').join('')||'<p>No collaborations in this category.</p>';document.querySelectorAll('.report-dispute').forEach(b=>b.onclick=async()=>{const reason=prompt('Describe the dispute (at least 10 characters):');if(reason===null)return;try{await api('/my-collaborations/'+b.dataset.application+'/dispute',{method:'POST',body:JSON.stringify({reason})});const item=rows.find(p=>p.application_id===b.dataset.application);if(item)item.is_disputed=1;render()}catch(err){alert(err.message)}})};document.getElementById('collab-filter').onchange=render;render()}catch(err){document.getElementById('collab-history-results').textContent=err.message}return}
if(page==='history'){
layout('My Collabo History','<div class="initiator-history-content"><p class="muted">Track all the Collabos you have posted and update their progress.</p><label>Filter by stage<select id="history-status"><option value="all">All projects</option><option value="posted">Posted</option><option value="open">Open — positions unfilled</option><option value="ongoing">Ongoing — work in progress</option><option value="closed">Closed — completed</option></select></label><div id="history-list" role="status">Loading your projects…</div></div>','initiator');
try{const data=await api('/my-projects'),projects=data.projects||[],editable=data.lifecycle_editable!==false;const labels={posted:'Posted',open:'Open — positions unfilled',ongoing:'Ongoing — work in progress',closed:'Closed — completed'};const render=()=>{const filter=document.getElementById('history-status').value;const selected=projects.filter(p=>filter==='all'||p.lifecycle_stage===filter);const host=document.getElementById('history-list');host.innerHTML='<p><strong>'+selected.length+'</strong> project'+(selected.length===1?'':'s')+' shown</p>'+selected.map(p=>'<article class="own-collabo" style="border:3px solid #1673dc;background:#eaf4ff;box-shadow:0 0 0 2px #d2e8ff"><h3>'+esc(p.title)+'</h3><p>'+esc(p.description)+'</p><p class="muted">'+esc(p.category)+' · '+esc(p.location)+'</p><p><strong>Stage:</strong> '+esc(labels[p.lifecycle_stage]||p.lifecycle_stage)+'</p><p class="muted">Posted: '+esc(p.created_at)+'</p><button data-project="'+esc(p.id)+'">View and manage</button><button type="button" class="history-pause" data-id="'+esc(p.id)+'" style="margin-left:8px">'+(p.status==='paused'?'Resume project':'Stop / pause project')+'</button><button type="button" class="history-delete" data-id="'+esc(p.id)+'" style="margin-left:8px;color:#9f1d1d;border-color:#c88">Delete project</button>'+(editable?'<label>Update project stage<select class="history-stage" data-id="'+esc(p.id)+'">'+Object.entries(labels).map(([key,value])=>'<option value="'+key+'"'+(p.lifecycle_stage===key?' selected':'')+'>'+esc(value)+'</option>').join('')+'</select></label>':'<p class="muted">Stage editing will be available after database setup.</p>')+'</article>').join('')||'<p>No projects found for this stage.</p>';host.querySelectorAll('.history-pause').forEach(btn=>btn.onclick=async()=>{const p=projects.find(item=>item.id===btn.dataset.id);if(!p)return;const status=p.status==='paused'?'open':'paused';if(status==='paused'){const reason=await requestStatusReason('pause',p.title);if(!reason)return;btn.dataset.reason=reason;}btn.disabled=true;try{await api('/projects/'+p.id,{method:'PATCH',body:JSON.stringify({status,reason:btn.dataset.reason||''})});delete btn.dataset.reason;p.status=status;render()}catch(err){btn.disabled=false;alert(err.message)}});host.querySelectorAll('.history-delete').forEach(btn=>btn.onclick=async()=>{const p=projects.find(item=>item.id===btn.dataset.id);if(!p)return;if(!confirm('Permanently delete "'+p.title+'"? This cannot be undone. Deletion is only allowed when no collaborator has been approved. Pending applications and saved pictures will also be removed.'))return;btn.disabled=true;try{await api('/projects/'+p.id,{method:'DELETE'});projects.splice(projects.indexOf(p),1);render()}catch(err){btn.disabled=false;alert(err.message)}});host.querySelectorAll('.history-stage').forEach(sel=>sel.onchange=async()=>{const p=projects.find(p=>p.id===sel.dataset.id);if(!p)return;const prior=p.lifecycle_stage;sel.disabled=true;try{await api('/projects/'+p.id+'/lifecycle',{method:'PATCH',body:JSON.stringify({stage:sel.value})});p.lifecycle_stage=sel.value;render()}catch(err){sel.value=prior;sel.disabled=false;alert(err.message)}})};document.getElementById('history-status').onchange=render;render()}catch(err){document.getElementById('history-list').textContent=err.message}return}
if(page==='post'){
const taxonomy=window.CC_POST_DATA||{categories:['Other'],countryCodes:[],places:{}};
const countries=new Intl.DisplayNames([document.documentElement.lang||'en'],{type:'region'});
const options=taxonomy.categories.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
const countryEntries=taxonomy.countryCodes.map(code=>({code,name:countries.of(code)})).sort((a,b)=>a.name.localeCompare(b.name));
const countryOptions=countryEntries.map(x=>'<option value="'+esc(x.name)+'"></option>').join('');
layout('Start a Collabo','<p class="muted">Describe your Collabo and save your draft as you work. Guests can complete the form; sign-up is required only when publishing.</p><div class="posting-layout"><form id="project-form"><label>Project title<input name="title" minlength="3" maxlength="160" required></label><label>Description<textarea name="description" maxlength="5000" rows="5"></textarea></label><section class="needs-section"><h3>Collaborators and resources needed</h3><label>How many different roles or resource types?<input id="need-count" type="number" min="1" max="10" value="1" required></label><div id="need-rows"></div><button type="button" id="need-add">+ Add another role or item</button><p class="muted">Example: Dancer — 10 people; Tents — 3 items.</p></section><label>Project category<select name="category" id="post-category" required><option value="">Select category</option>'+options+'</select></label><label id="other-category-wrap" hidden>Specify category<input id="other-category" maxlength="80"></label><label>Country<input id="post-country-search" list="post-country-options" placeholder="Type a country, e.g. Ken for Kenya" autocomplete="off" required><datalist id="post-country-options">'+countryOptions+'</datalist><input type="hidden" id="post-country"></label><label>State / Province / County<input id="post-state" list="state-suggestions" maxlength="80" placeholder="Enter or select state, province or county" required><datalist id="state-suggestions"></datalist></label><label>City / Town<input id="post-city" list="city-suggestions" maxlength="80" placeholder="Enter or select city" required><datalist id="city-suggestions"></datalist></label><h3>Project pictures (up to 3)</h3><p class="muted">Choose, replace or remove each picture separately before publishing.</p><div id="post-image-slots" class="picture-slots"></div><p id="picture-feedback" role="status"></p><p class="muted">Selected pictures are saved with your draft on this device and uploaded to the project when publishing succeeds. Photos are compressed and converted to JPG when needed (maximum 5 MB uploaded).</p><label>Collaboration type<select name="collaboration_mode"><option>Hybrid</option><option>Local</option><option>Remote</option></select></label><p class="muted" id="draft-status" role="status">Draft autosave enabled.</p><button class="primary" type="submit">Publish project</button><button type="button" id="clear-collabo-draft" style="margin-left:8px;border:1px solid #c62828;color:#b71c1c;background:#fff">Clear Draft / Start New Collabo</button><p id="project-feedback" role="status"></p></form><aside class="posting-guide" aria-label="How to successfully list your Collabo"><div class="guide-illustration"><svg viewBox="0 0 660 260" role="img" aria-label="Three stages: a farmer faces a problem, collaborators bring resources, and the project produces a successful harvest" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ccsky" x2="0" y2="1"><stop stop-color="#c9e9ff"/><stop offset="1" stop-color="#f6fff1"/></linearGradient></defs><rect width="660" height="260" rx="18" fill="#e8f6e9"/><g transform="translate(12 18)"><rect width="196" height="184" rx="18" fill="url(#ccsky)" stroke="#dc2626" stroke-width="4"/><path d="M3 127Q85 93 193 127V183H3Z" fill="#c89a51"/><path d="M8 147H190M10 165H188" stroke="#9a6c35" stroke-width="4"/><circle cx="96" cy="76" r="27" fill="#a96e46"/><path d="M64 68Q96 12 127 68Z" fill="#d4a14e"/><rect x="42" y="106" width="108" height="75" rx="32" fill="#337a52"/><text x="98" y="216" text-anchor="middle" font-size="19" font-weight="bold" fill="#b91c1c">1 Problem</text></g><path d="M211 110l18-18v11h16v14h-16v11z" fill="#e24d2a"/><g transform="translate(244 18)"><rect width="188" height="184" rx="18" fill="url(#ccsky)" stroke="#1673dc" stroke-width="4"/><circle cx="47" cy="79" r="23" fill="#a96e46"/><circle cx="96" cy="67" r="24" fill="#b87953"/><circle cx="146" cy="79" r="23" fill="#d9a17c"/><path d="M13 167V120Q47 92 80 120V167M61 167V109Q96 88 129 109V167M113 167V120Q146 92 177 120V167" fill="#207d51"/><rect x="57" y="143" width="76" height="28" rx="5" fill="#fff" stroke="#1673dc"/><text x="95" y="163" text-anchor="middle" font-size="21">🤝</text><text x="94" y="213" text-anchor="middle" font-size="17" font-weight="bold" fill="#1355a1">2 Collaboration</text><text x="94" y="231" text-anchor="middle" font-size="14" fill="#1355a1">(Resources)</text></g><path d="M435 110l18-18v11h16v14h-16v11z" fill="#15803d"/><g transform="translate(469 18)"><rect width="178" height="184" rx="18" fill="url(#ccsky)" stroke="#15803d" stroke-width="4"/><path d="M4 132Q87 95 174 132V182H4Z" fill="#65a43c"/><g stroke="#277b2e" stroke-width="5"><path d="M27 171V130M51 171V126M75 171V130M99 171V127M123 171V132M147 171V127"/></g><g fill="#e8ba3f"><ellipse cx="27" cy="136" rx="9" ry="13"/><ellipse cx="51" cy="132" rx="9" ry="13"/><ellipse cx="75" cy="136" rx="9" ry="13"/><ellipse cx="99" cy="133" rx="9" ry="13"/><ellipse cx="123" cy="138" rx="9" ry="13"/><ellipse cx="147" cy="132" rx="9" ry="13"/></g><circle cx="87" cy="70" r="27" fill="#a96e46"/><path d="M54 60Q87 15 120 60Z" fill="#d4a14e"/><path d="M57 103Q87 88 118 103V130H57Z" fill="#277b52"/><text x="89" y="216" text-anchor="middle" font-size="19" font-weight="bold" fill="#15803d">3 Results</text></g></svg></div><h3>List your Collabo successfully</h3><p class="muted">Follow this simple guide to create a clear project that collaborators can understand and apply to.</p><ol class="guide-steps"><li><strong>Name your project</strong>Choose a clear title that explains what you want to achieve.</li><li><strong>Describe the opportunity</strong>Explain the goal, scope, expected outcome and what help you need.</li><li><strong>Select category and location</strong>Choose the industry, country, region and city.</li><li><strong>Add project pictures</strong>Choose up to three pictures to publish with your project.</li><li><strong>Review and publish</strong>Check your details, then publish to signed-in members.</li></ol><p class="muted"><small>Tip: Include the skills and contributions you need. Never post passwords or sensitive personal details.</small></p></aside></div>','initiator');
const f=document.getElementById('project-form'),country=f.querySelector('#post-country'),countrySearch=f.querySelector('#post-country-search'),state=f.querySelector('#post-state'),city=f.querySelector('#post-city'),category=f.querySelector('#post-category'),other=f.querySelector('#other-category'),otherWrap=f.querySelector('#other-category-wrap'),status=f.querySelector('#draft-status');
function resolveCountry(){const match=countryEntries.find(x=>x.name.toLocaleLowerCase()===countrySearch.value.trim().toLocaleLowerCase());country.value=match?.code||'';countrySearch.setCustomValidity(match?'':'Select a country from the suggestions.');return !!match}
function suggestions(){const regions=taxonomy.places[country.value]||{};f.querySelector('#state-suggestions').innerHTML=Object.keys(regions).map(x=>'<option value="'+esc(x)+'"></option>').join('');f.querySelector('#city-suggestions').innerHTML=(regions[state.value]||[]).map(x=>'<option value="'+esc(x)+'"></option>').join('')}
function categoryChange(){otherWrap.hidden=category.value!=='Other';other.required=!otherWrap.hidden}
function getNeeds(){return [...f.querySelectorAll('.need-row')].map(el=>({item_name:el.querySelector('.need-name').value,quantity:Number(el.querySelector('.need-qty').value),details:el.querySelector('.need-details').value}))}
function renderNeeds(rows){const host=f.querySelector('#need-rows');host.replaceChildren();rows.slice(0,10).forEach((n,i)=>{const row=document.createElement('div');row.className='need-row';row.innerHTML='<h4>Requirement '+(i+1)+'</h4><label>Role / item<input class="need-name" maxlength="120" required placeholder="e.g. Dancer, tents"></label><label>How many people or items?<input class="need-qty" type="number" min="1" max="10000" required></label><label>Details<textarea class="need-details" maxlength="1000" rows="2"></textarea></label><button type="button" class="need-remove">Remove</button>';row.querySelector('.need-name').value=n.item_name||'';row.querySelector('.need-qty').value=n.quantity||1;row.querySelector('.need-details').value=n.details||'';row.querySelector('.need-remove').onclick=()=>{const x=getNeeds();x.splice(i,1);renderNeeds(x);save()};host.append(row)});f.querySelector('#need-count').value=rows.length;f.querySelector('#need-add').disabled=rows.length>=10;host.querySelectorAll('.need-remove').forEach(b=>b.disabled=rows.length===1)}
f.querySelector('#need-count').onchange=e=>{const count=Math.max(1,Math.min(10,Math.trunc(Number(e.target.value)||1))),rows=getNeeds();while(rows.length<count)rows.push({item_name:'',quantity:1,details:''});renderNeeds(rows.slice(0,count));save()};
f.querySelector('#need-add').onclick=()=>{const rows=getNeeds();if(rows.length<10){renderNeeds([...rows,{item_name:'',quantity:1,details:''}]);save()}};
renderNeeds([{item_name:'',quantity:1,details:''}]);
let draftSaveTimer=null;function flushDraft(){if(draftSaveTimer!==null){clearTimeout(draftSaveTimer);draftSaveTimer=null}try{localStorage.setItem(draftKey,JSON.stringify({title:f.elements.title.value,description:f.elements.description.value,category:category.value,other:other.value,country:country.value,state:state.value,city:city.value,collaboration_mode:f.elements.collaboration_mode.value,needs:getNeeds()}));status.textContent='Draft saved on this device.'}catch{status.textContent='Autosave unavailable on this device; keep this tab open.'}}function save(){if(draftSaveTimer!==null)clearTimeout(draftSaveTimer);status.textContent='Saving draft…';draftSaveTimer=setTimeout(flushDraft,350)}f.addEventListener('focusout',()=>{if(draftSaveTimer!==null)flushDraft()});
try{const d=JSON.parse(localStorage.getItem(draftKey)||'null');if(d){if(Array.isArray(d.needs)&&d.needs.length)renderNeeds(d.needs);f.elements.title.value=d.title||'';f.elements.description.value=d.description||'';category.value=d.category||'';other.value=d.other||'';country.value=d.country||'';countrySearch.value=countryEntries.find(x=>x.code===country.value)?.name||'';resolveCountry();state.value=d.state||'';city.value=d.city||'';f.elements.collaboration_mode.value=d.collaboration_mode||'Hybrid';status.textContent='Saved draft restored.'}}catch{}
suggestions();categoryChange();const imageHost=f.querySelector('#post-image-slots'),pictureFeedback=f.querySelector('#picture-feedback');
const pictureFiles=[null,null,null],pictureUrls=[null,null,null];
const projectPublishIdKey='cc-collabo-draft-publish-id';
const pictureUploadMaxBytes=5*1024*1024;
async function normalizePicture(file,forceJpeg=false){
 if(!file||(!file.type.startsWith('image/')&&!/\.(jpe?g|png|webp|heic|heif|avif|gif|bmp|tiff?)$/i.test(file.name||'')))throw Error('Select a picture.');
 if(file.size>25*1024*1024)throw Error('Original picture is over 25 MB. Choose a smaller photo.');
 if(!forceJpeg&&['image/jpeg','image/png','image/webp'].includes(file.type)&&file.size<=pictureUploadMaxBytes)return file;
 let image,url;
 try{
  if(typeof createImageBitmap==='function')image=await createImageBitmap(file).catch(()=>null);
  if(!image){url=URL.createObjectURL(file);image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Your browser cannot read this photo. Export it as JPG, PNG or WebP and try again.'));img.src=url})}
  let width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;
  if(!width||!height)throw Error('Could not read picture dimensions.');
  const scale=Math.min(1,2560/Math.max(width,height));width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Picture conversion is not available on this device.');
  for(let attempt=0;attempt<7;attempt++){
   canvas.width=width;canvas.height=height;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',Math.max(.55,.88-attempt*.05)));
   if(!blob)throw Error('Picture compression failed.');
   if(blob.size<=pictureUploadMaxBytes)return new File([blob],(file.name||'picture').replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
   width=Math.max(1,Math.round(width*.75));height=Math.max(1,Math.round(height*.75));
  }
  throw Error('This picture could not be compressed below 5 MB.');
 }finally{if(url)URL.revokeObjectURL(url);if(image&&typeof image.close==='function')image.close()}
}
async function uploadPictures(projectId,files,feedback){
 const selected=files.map((file,i)=>file?i:-1).filter(i=>i>=0);
 for(let n=0;n<selected.length;n++){
  const i=selected[n];
  feedback.textContent='Preparing picture '+(n+1)+' of '+selected.length+'…';
  // Normalize even restored IndexedDB blobs: iOS can restore a previewable file
  // with an unsupported or empty MIME type.
  const file=await normalizePicture(files[i],true);
  feedback.textContent='Uploading picture '+(n+1)+' of '+selected.length+'…';
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
   try{
    const token=await window.cloudCollaboGetToken?.();
    if(!token)throw Error('Sign in to upload pictures');
    const response=await fetch('/api/projects/'+projectId+'/pictures/'+(i+1),{
     method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'image/jpeg'},body:file
    });
    const result=await response.json().catch(()=>({error:'Picture service returned an unexpected response'}));
    if(!response.ok)throw Error(result.error||'Picture upload failed');
    if(!result.saved)throw Error('Picture upload was not confirmed');
    lastError=null;break;
   }catch(error){
    lastError=error;
    if(/not configured|not available|not found|Only the Initiator|file content|picture type|Maximum picture size/i.test(error.message))break;
    if(attempt<2)feedback.textContent='Retrying picture '+(n+1)+'…';
   }
  }
  if(lastError)throw Error('Picture '+(i+1)+' could not be uploaded: '+lastError.message);
 }
}

async function restoreDraftPictures(){let count=0;try{for(let i=0;i<3;i++){const file=await imageDraft('read',i);if(file instanceof Blob&&file.size){pictureFiles[i]=file;pictureUrls[i]=URL.createObjectURL(file);count++}}renderPictureSlots();pictureFeedback.className=count?'success':'muted';pictureFeedback.textContent=count?count+' saved picture'+(count===1?'':'s')+' restored with your draft.':'No saved pictures in this draft.'}catch{pictureFeedback.className='error';pictureFeedback.textContent='Could not restore saved pictures on this device.'}}

function renderPictureSlots(){
 imageHost.replaceChildren();
 pictureFiles.forEach((file,i)=>{
  const card=document.createElement('div');card.className='picture-slot';
  const heading=document.createElement('strong');heading.textContent='Picture '+(i+1);card.append(heading);
  if(file){const img=document.createElement('img');img.src=pictureUrls[i];img.alt='Preview of picture '+(i+1);card.append(img)}
  else{const empty=document.createElement('div');empty.className='empty-picture';empty.textContent='No picture selected';card.append(empty)}
  const label=document.createElement('label');label.textContent=file?'Replace picture':'Choose picture';
  const input=document.createElement('input');input.type='file';input.accept='image/*';input.setAttribute('aria-label',(file?'Replace':'Choose')+' picture '+(i+1));
  input.addEventListener('change',async()=>{
   const selected=input.files?.[0];if(!selected)return;
   let prepared;try{pictureFeedback.className='muted';pictureFeedback.textContent='Compressing picture…';prepared=await normalizePicture(selected)}catch(err){pictureFeedback.className='error';pictureFeedback.textContent=err.message;input.value='';return}
   if(pictureUrls[i])URL.revokeObjectURL(pictureUrls[i]);
   pictureFiles[i]=prepared;pictureUrls[i]=URL.createObjectURL(prepared);
   imageDraft('write',i,prepared).then(()=>{pictureFeedback.className='success';pictureFeedback.textContent='Picture '+(i+1)+' saved with your draft on this device.'}).catch(()=>{pictureFeedback.className='error';pictureFeedback.textContent='Picture '+(i+1)+' preview is available, but it could not be saved for refresh. Keep this tab open.'});
   pictureFeedback.className='success';pictureFeedback.textContent='Picture '+(i+1)+' selected. You can replace or remove it.';
   renderPictureSlots();
  });label.append(input);card.append(label);
  if(file){const remove=document.createElement('button');remove.type='button';remove.className='remove-picture';remove.textContent='Delete picture '+(i+1);remove.onclick=()=>{URL.revokeObjectURL(pictureUrls[i]);pictureUrls[i]=null;pictureFiles[i]=null;imageDraft('delete',i).catch(()=>{pictureFeedback.className='error';pictureFeedback.textContent='Could not remove the stored picture.'});pictureFeedback.textContent='Picture '+(i+1)+' removed.';renderPictureSlots()};card.append(remove)}
  imageHost.append(card);
 })
}
renderPictureSlots();restoreDraftPictures();
document.getElementById('clear-collabo-draft').onclick=async()=>{
 if(draftSaveTimer!==null){clearTimeout(draftSaveTimer);draftSaveTimer=null}
 try{localStorage.removeItem(draftKey);localStorage.removeItem(projectPublishIdKey)}catch{}
 try{await clearImageDraft()}catch{}
 pictureUrls.forEach(url=>{if(url)URL.revokeObjectURL(url)});
 route();
};
f.addEventListener('input',save);f.addEventListener('change',save);
category.addEventListener('change',categoryChange);
countrySearch.addEventListener('input',()=>{const previous=country.value;resolveCountry();if(previous!==country.value){state.value='';city.value='';suggestions()}save()});
state.addEventListener('input',()=>{suggestions();save()});
f.onsubmit=async e=>{e.preventDefault();flushDraft();if(!window.cloudCollaboIsSignedIn?.()){window.cloudCollaboPendingPage='post';document.getElementById('project-feedback').textContent='Create an account or sign in to publish. Your draft is saved.';window.cloudCollaboSignIn?.();return}if(!resolveCountry()){countrySearch.reportValidity();return}const b=f.querySelector('button[type=submit]'),out=document.getElementById('project-feedback');b.disabled=true;out.className='muted';out.textContent='Publishing…';try{const payload=Object.fromEntries(new FormData(f));payload.needs=getNeeds();payload.category=category.value==='Other'?other.value.trim()||'Other':category.value;payload.location=[city.value.trim(),state.value.trim(),countries.of(country.value)].filter(Boolean).join(', ');payload.picture_count=pictureFiles.filter(Boolean).length;let id=localStorage.getItem(projectPublishIdKey);if(!id){id=crypto.randomUUID();localStorage.setItem(projectPublishIdKey,id)}payload.client_project_id=id;const d=await api('/projects',{method:'POST',body:JSON.stringify(payload)});await uploadPictures(d.id,pictureFiles,out);localStorage.removeItem(draftKey);localStorage.removeItem(projectPublishIdKey);await clearImageDraft();out.className='success';out.textContent='Project and '+payload.picture_count+' picture(s) published successfully.';location.hash='project/'+d.id}catch(err){out.className='muted';out.textContent='Upload not completed. '+err.message+' Your draft and pictures are safe. Select Publish project again to retry without creating a duplicate.'}finally{b.disabled=false}};return}

async function initializeGlobalCollaboMap(projects){
 const toggle=document.getElementById('collabo-map-toggle'),panel=document.getElementById('collabo-world-map'),notice=document.getElementById('collabo-map-notice');
 if(!toggle||!panel)return;
 let map=null,markers=null,started=false;
 const addStyle=()=>{if(document.getElementById('cc-leaflet-style'))return;const link=document.createElement('link');link.id='cc-leaflet-style';link.rel='stylesheet';link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.append(link);const style=document.createElement('style');style.textContent='body:has(.market #collabo-world-map:not([hidden])) #collabo-world-map{scroll-margin-top:12px}@media(max-width:650px){#collabo-world-map{height:calc(100dvh - 110px)!important;min-height:360px;max-height:680px!important}body:has(.market #collabo-world-map:not([hidden])) .market{padding-top:10px!important}}.cc-map-pin{width:16px;height:16px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 0 0 4px #ef444477;animation:cc-pulse 1.8s infinite}@keyframes cc-pulse{50%{box-shadow:0 0 0 11px #ef444422;transform:scale(1.2)}}#collabo-world-map{height:460px;max-height:70vh;border-radius:14px;overflow:hidden;border:2px solid #e5e7eb}.cc-map-popup button{background:#b91c1c;color:white;border:0;border-radius:7px;padding:8px 12px;cursor:pointer}';document.head.append(style)};
 const loadLeaflet=()=>new Promise((resolve,reject)=>{if(window.L)return resolve(window.L);const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.onload=()=>resolve(window.L);script.onerror=()=>reject(Error('Map library unavailable'));document.head.append(script)});
 const locationCache=new Map();
 const lookup=async locationName=>{
  if(locationCache.has(locationName))return locationCache.get(locationName);
  const key='cc-map-geocode-v1:'+locationName.toLowerCase();let stored=null;try{stored=JSON.parse(localStorage.getItem(key)||'null')}catch{}
  if(stored&&Number.isFinite(stored.lat)&&Number.isFinite(stored.lon)){locationCache.set(locationName,stored);return stored}
  const response=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(locationName),{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Location lookup unavailable');
  const data=await response.json();const hit=data[0];if(!hit)return null;
  const point={lat:Number(hit.lat),lon:Number(hit.lon)};locationCache.set(locationName,point);try{localStorage.setItem(key,JSON.stringify(point))}catch{}return point;
 };
 const render=async()=>{
  const L=window.L;if(!L||!map)return;
  markers.clearLayers();
  const q=(document.getElementById('project-filter')?.value||'').toLowerCase();
  const visible=projects.filter(p=>[p.title,p.category,p.location,p.description].some(v=>String(v||'').toLowerCase().includes(q)));
  const grouped=new Map();visible.forEach(p=>{const place=String(p.location||'').trim();if(place){if(!grouped.has(place))grouped.set(place,[]);grouped.get(place).push(p)}});
  const bounds=[];let count=0,missing=0;
  const entries=[...grouped.entries()].slice(0,35);
  for(const [place,items] of entries){
   if(panel.hidden||!document.getElementById('collabo-map-toggle'))return;
   try{
    const point=await lookup(place);
    if(point){
     const icon=L.divIcon({className:'',html:'<div class="cc-map-pin"></div>',iconSize:[20,20],iconAnchor:[10,10]});
     const pin=L.marker([point.lat,point.lon],{icon}).addTo(markers);bounds.push([point.lat,point.lon]);count+=items.length;
     const popup=document.createElement('div');popup.className='cc-map-popup';
     const heading=document.createElement('strong');heading.textContent=place+' · '+items.length+' Collabo'+(items.length===1?'':'s');popup.append(heading);
     items.forEach(p=>{const row=document.createElement('p');row.textContent=p.title+' ('+(p.category||'Project')+') ';const button=document.createElement('button');button.type='button';button.textContent='Open Collabo';button.onclick=()=>{location.hash='#project/'+p.id};row.append(button);popup.append(row)});pin.bindPopup(popup,{maxWidth:320});
    }else missing+=items.length;
   }catch{missing+=items.length}
   notice.textContent='Mapped '+count+' Collabos'+(missing?' · '+missing+' without verified map locations':'')+'.';
   await new Promise(done=>setTimeout(done,1100));
  }
  if(bounds.length)map.fitBounds(bounds,{padding:[35,35],maxZoom:7});
  notice.textContent='Showing '+count+' Collabos on the map'+(missing?' · '+missing+' locations could not be resolved':'')+(grouped.size>entries.length?' · zoom/filter to narrow results; only first 35 distinct locations loaded':'')+'. Tap a red dot to open a Collabo.';
 };
 toggle.onclick=async()=>{
  panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));
  if(panel.hidden){toggle.textContent='Show Collabos on world map';return}
  toggle.textContent='Hide world map';notice.textContent='Loading worldwide Collabo locations…';
  if(!started){
   started=true;
   try{addStyle();const L=await loadLeaflet();map=L.map(panel,{worldCopyJump:true}).setView([15,0],2);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);markers=L.layerGroup().addTo(map)}catch(e){notice.textContent=e.message;started=false;return}
  }
  map.invalidateSize();await render();
 };
}

if(page==='explore'||page==='map'){layout(page==='map'?'Collabo World Map':'Explore Collabos','<label>Search projects<input id="project-filter" placeholder="Title, category, location"></label><button type="button" id="collabo-map-toggle" aria-expanded="false">Show Collabos on world map</button><p id="collabo-map-notice" class="muted" role="status">Red dots show published Collabos with identifiable locations.</p><div id="collabo-world-map" hidden aria-label="Worldwide Collabo map"></div><div id="project-list">Loading…</div>','collaborator');try{const d=window.cloudCollaboIsSignedIn?.()?await api('/projects'):await fetch('/api/public/projects').then(r=>{if(!r.ok)throw Error('Projects temporarily unavailable');return r.json()});const projects=(d.projects||[]).map(p=>({...p,needs:[],requirementsAvailable:false}));initializeGlobalCollaboMap(projects);if(page==='map'){const mapToggle=document.getElementById('collabo-map-toggle');mapToggle?.click();requestAnimationFrame(()=>{const panel=document.getElementById('collabo-world-map');if(panel&&!panel.hidden){panel.scrollIntoView({behavior:'instant',block:'start'});}})}const render=()=>{const q=document.getElementById('project-filter').value.toLowerCase();document.getElementById('project-list').innerHTML=projects.filter(p=>[p.title,p.category,p.location,p.description].some(v=>String(v||'').toLowerCase().includes(q))).map(p=>'<article'+(p.is_owner?' class="own-collabo" style="border:3px solid #1673dc;background:#eaf4ff;box-shadow:0 0 0 2px #d2e8ff"':'')+'><p class="collabo-serial-tag">Collabo ID: '+esc(p.collabo_number||'Unavailable')+'</p><h3>'+esc(p.title)+'</h3>'+(p.is_owner?'<p><strong style="display:inline-block;background:#1464c8;color:white;padding:7px 12px;border-radius:8px">You posted this</strong></p>':'')+'<p>'+esc(p.description)+'</p><p class="muted">'+esc(p.category)+' · '+esc(p.location)+' · '+esc(p.collaboration_mode)+'</p><strong>Collaborators / items wanted</strong><ul>'+p.needs.map(n=>'<li>'+esc(n.item_name)+': '+n.quantity+' needed, '+n.approved+' approved</li>').join('')+'</ul>'+(p.requirementsAvailable?'':(window.cloudCollaboIsSignedIn?.()?'<p class="muted">Collaborator details are temporarily unavailable. You can still view this project.</p>':'<p class="muted">Open this Collabo to see the required roles and resources.</p>'))+(p.is_owner?'<button data-project="'+esc(p.id)+'">View your Collabo</button><button type="button" disabled aria-disabled="true" title="You cannot apply to your own Collabo" style="margin-left:8px;background:#fee2e2!important;color:#b91c1c!important;border:1px solid #ef4444!important;opacity:1;font-weight:700;cursor:not-allowed">Apply unavailable — your project</button>':'<button data-project="'+esc(p.id)+'">'+(window.cloudCollaboIsSignedIn?.()?'View roles and apply':'Preview this Collabo')+'</button>')+'</article>').join('')||'<p>No matching projects.</p>'};let filterTimer;document.getElementById('project-filter').oninput=()=>{clearTimeout(filterTimer);filterTimer=setTimeout(render,180)};render();const queue=[...projects];let workers=0;async function loadNext(){const p=queue.shift();if(!p)return;try{const details=await api('/projects/'+p.id+'/needs');p.needs=details.needs||[];p.requirementsAvailable=details.requirements_available!==false}catch{}if(location.hash==='#explore'||location.hash==='#map')render();await loadNext()}if(window.cloudCollaboIsSignedIn?.())for(let i=0;i<Math.min(4,queue.length);i++)loadNext()}catch(err){document.getElementById('project-list').textContent=err.message}return}
const match=/^project\/([a-f0-9-]{36})$/.exec(page);if(match){layout('Project details','<div id="project-details">Loading…</div>');try{const [data,needData,appData]=await Promise.all([api('/projects/'+match[1]),api('/projects/'+match[1]+'/needs'),api('/projects/'+match[1]+'/role-applications')]);const p=data.project,needs=needData.needs||[];const nav=main.querySelector('.market nav');if(nav){main.querySelectorAll('.market > .role-banner').forEach(el=>el.remove());nav.insertAdjacentHTML('afterend',roleBanner(p.is_owner?'initiator':'collaborator'))}const root=document.getElementById('project-details');root.insertAdjacentHTML('beforebegin','<p class="projection-link"><button type="button" data-route="projection/'+match[1]+'" class="primary">View Collabo Projection &amp; Financial Workspace</button></p>');const pictureSection=document.createElement('section');pictureSection.id='published-pictures';root.append(pictureSection);async function refreshPublishedPictures(){try{const data=await api('/projects/'+match[1]+'/pictures');pictureSection.innerHTML='<h3>Project pictures</h3><div class="image-preview">'+(data.pictures||[]).map(x=>'<img class="project-stored-image" data-slot="'+x.slot+'" alt="Project picture '+x.slot+'">').join('')+'</div>'+(p.is_owner?'<label>Add or replace project picture (slot 1–3)<select id="published-picture-slot"><option value="1">Picture 1</option><option value="2">Picture 2</option><option value="3">Picture 3</option></select><input id="published-picture-file" type="file" accept="image/*"></label><button id="published-picture-upload" type="button">Save picture to project</button><p id="published-picture-feedback" role="status"></p>':'');for(const img of pictureSection.querySelectorAll('.project-stored-image')){try{const token=await window.cloudCollaboGetToken?.();const response=await fetch('/api/projects/'+match[1]+'/pictures/'+img.dataset.slot,{headers:{Authorization:'Bearer '+token}});if(!response.ok)throw Error('Picture unavailable');img.src=URL.createObjectURL(await response.blob())}catch{img.alt='Picture temporarily unavailable'}}if(p.is_owner){document.getElementById('published-picture-upload').onclick=async()=>{const file=document.getElementById('published-picture-file').files[0],slot=document.getElementById('published-picture-slot').value,out=document.getElementById('published-picture-feedback');if(!file){out.textContent='Choose a picture first.';return}try{out.textContent='Compressing picture…';const prepared=await normalizePicture(file);await api('/projects/'+match[1]+'/pictures/'+slot,{method:'PUT',headers:{'content-type':prepared.type},body:prepared});await refreshPublishedPictures()}catch(err){out.textContent=err.message}}}}catch(err){pictureSection.textContent=p.is_owner?'Project pictures unavailable: '+err.message:''}};root.innerHTML='<article'+(p.is_owner?' class="own-collabo" style="border:3px solid #1673dc;background:#eaf4ff"':'')+'><p class="collabo-serial-tag">Collabo ID: '+esc(p.collabo_number||'Unavailable')+'</p><h3>'+esc(p.title)+'</h3>'+(p.is_owner?'<p><strong style="display:inline-block;background:#1464c8;color:white;padding:7px 12px;border-radius:8px">You posted this — applications disabled</strong></p>':'')+'<p>'+esc(p.description)+'</p><p class="muted">'+esc(p.category)+' · '+esc(p.location)+' · '+esc(p.collaboration_mode)+'</p><h3>Collaborators / resources wanted</h3><div class="collabo-needs-list">'+needs.map(n=>'<div class="need-fulfillment '+(Number(n.approved)>=Number(n.quantity)?'need-filled':'need-open')+'"><span class="need-fulfillment-top"><strong>'+esc(n.item_name)+'</strong><span class="need-count">'+n.approved+' / '+n.quantity+' approved</span></span>'+(n.details?'<span class="need-details">'+esc(n.details)+'</span>':'')+'</div>').join('')+'</div></article>'+(p.is_owner?'<h3>Applications awaiting your decision</h3><div id="applications"></div>':p.status==='open'?'<form id="role-apply"><h3>Apply for a role</h3><label>Select role / item<select name="need_id" required>'+needs.filter(n=>n.approved<n.quantity).map(n=>'<option value="'+esc(n.id)+'">'+esc(n.item_name)+' ('+(n.quantity-n.approved)+' remaining)</option>').join('')+'</select></label><label>Your experience / qualifications<textarea name="experience" required maxlength="2000" rows="3"></textarea></label><label>Quantity you can provide<input name="offered_quantity" type="number" min="1" max="'+Math.max(0,...needs.filter(n=>n.approved<n.quantity).map(n=>n.quantity-n.approved))+'" value="1" required><small id="quantity-guidance">You cannot offer more than the initiator requested for the selected role.</small></label><label>Proposed rate ($ USD)<input name="rate_amount" type="number" min="0" step="0.01" required></label><label>Currency<input name="currency" value="USD" readonly></label><label>Rate basis<select name="rate_period"><option value="hour">Per hour</option><option value="day">Per day</option><option value="month">Per month</option><option value="project">Per project</option><option value="item">Per item</option></select></label><label>Additional message<textarea name="message" maxlength="2000"></textarea></label><button class="primary" type="submit">Submit application</button><p id="apply-feedback" role="status"></p></form>':'<p>Applications closed.</p>')+'<div id="private-application-status" hidden><h3>My approved application</h3><div id="my-applications"></div></div><section id="team-chat"></section>';
const agreementHost=document.createElement('div');root.append(agreementHost);renderShareAgreement(p,agreementHost);
root.insertAdjacentHTML('beforeend',renderCollaboProgress(p,needs));root.prepend(pictureSection);refreshPublishedPictures();
if(!needs.length){const root=document.getElementById('project-details');const note=document.createElement('section');note.className='notice';if(p.is_owner){note.innerHTML='<h3>Restore missing collaborator roles</h3><p>This project was published without saved roles. Add the original roles and quantities below; existing project details will be preserved.</p><form id="restore-roles"><label>Roles, quantities and details (one per line, e.g. Dancer | 10 | Experience needed)<textarea name="roles" rows="5" required placeholder="Dancer | 10\nTent | 3"></textarea></label><button type="submit">Save missing roles</button><p id="restore-feedback" role="status"></p></form>';root.append(note);
const restoreForm=document.getElementById('restore-roles');
try{
 const saved=JSON.parse(localStorage.getItem(draftKey)||'null');
 if(saved&&saved.title?.trim().toLocaleLowerCase()===p.title?.trim().toLocaleLowerCase()&&Array.isArray(saved.needs)&&saved.needs.length){
  const valid=saved.needs.filter(n=>n&&n.item_name?.trim()&&Number.isInteger(Number(n.quantity))&&Number(n.quantity)>0).slice(0,10);
  if(valid.length){
   restoreForm.elements.roles.value=valid.map(n=>n.item_name+' | '+n.quantity+(n.details?' | '+n.details:'')).join('\\n');
   restoreForm.insertAdjacentHTML('afterbegin','<p class="success">Matching draft found on this device. Original roles and details have been filled in for your review. Select Save missing roles to restore them.</p>');
  }
 }
}catch{}
document.getElementById('restore-roles').onsubmit=async e=>{e.preventDefault();const out=document.getElementById('restore-feedback');try{const lines=e.currentTarget.elements.roles.value.split('\n').map(x=>x.trim()).filter(Boolean);const parsed=lines.map(line=>{const parts=line.split('|');return {item_name:(parts[0]||'').trim(),quantity:Number((parts[1]||'').trim()),details:parts.slice(2).join('|').trim()}});if(!parsed.length||parsed.length>10||parsed.some(x=>!x.item_name||!Number.isInteger(x.quantity)||x.quantity<1)){out.textContent='Enter 1–10 lines in the format Role | Quantity | Optional details';return}await api('/projects/'+match[1]+'/needs',{method:'POST',body:JSON.stringify({needs:parsed})});route()}catch(err){out.textContent=err.message}}}else{note.textContent='The Initiator has not saved any collaborator roles for this project. Applications are unavailable until the roles are restored.';root.append(note);const apply=document.getElementById('role-apply');if(apply)apply.remove()}}
const form=document.getElementById('role-apply');
if(form){
 const draftKey='cc-role-application-'+match[1];
 try{const saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');if(saved){for(const [name,value] of Object.entries(saved)){const field=form.elements.namedItem(name);if(field&&field.tagName!=='BUTTON')field.value=value}}}catch{}
 const save=()=>{const data=Object.fromEntries(new FormData(form));try{sessionStorage.setItem(draftKey,JSON.stringify(data))}catch{}};
 form.addEventListener('input',save);form.addEventListener('change',save);
}
if(form){const select=form.elements.need_id,quantity=form.elements.offered_quantity,guidance=document.getElementById('quantity-guidance');const syncQuantity=()=>{const need=needs.find(n=>n.id===select.value);const available=Math.max(0,(need?.quantity||0)-(need?.approved||0));quantity.max=String(available);if(Number(quantity.value)>available)quantity.value=String(available);guidance.textContent='Maximum available for this role: '+available+'. You cannot enter more than the initiator needs.'};select.addEventListener('change',syncQuantity);syncQuantity();}if(form)form.onsubmit=async e=>{e.preventDefault();const out=document.getElementById('apply-feedback');try{const payload=Object.fromEntries(new FormData(form));payload.offered_quantity=Number(payload.offered_quantity);const selected=needs.find(n=>n.id===payload.need_id);const remaining=Math.max(0,(selected?.quantity||0)-(selected?.approved||0));if(payload.offered_quantity>remaining||payload.offered_quantity<1){out.className='error';out.textContent='Only '+remaining+' position(s) available for this role. Please enter a quantity from 1 to '+remaining+'.';return}payload.rate_amount=Number(payload.rate_amount);payload.currency='USD';await api('/projects/'+match[1]+'/role-applications',{method:'POST',body:JSON.stringify(payload)});out.className='success';out.setAttribute('role','status');out.textContent='Application sent successfully! Your application has been delivered to the Initiator for review.';try{sessionStorage.removeItem('cc-role-application-'+match[1])}catch{};form.hidden=true;const success=document.createElement('div');success.setAttribute('role','status');success.style.cssText='background:#e8f7eb;border:1px solid #168444;border-radius:12px;padding:18px;margin:12px 0;text-align:center';success.innerHTML='<h3 style="margin:0 0 8px">✓ Application delivered!</h3><p>Your application was sent successfully. The Initiator will review it and notify you of the decision.</p><button type="button" class="primary" id="application-success-close">Close and return to Collabos</button>';out.replaceWith(success);success.querySelector('#application-success-close').onclick=()=>{location.hash='explore'};}catch(err){out.className='error';out.textContent=err.message}};
const apps=appData.applications;if(p.is_owner){const host=document.getElementById('applications');host.innerHTML=apps.map(a=>'<article data-application-status="'+esc(a.status)+'"><div class="application-title"><strong>'+esc(a.item_name)+'</strong><span class="application-status" data-status="'+esc(a.status)+'">'+esc(a.status==='declined'?'Rejected':a.status)+'</span></div><p><strong>Experience:</strong> '+esc(a.experience)+'</p><p><strong>Quantity:</strong> '+a.offered_quantity+' · <strong>Rate:</strong> '+esc(a.currency)+' '+a.rate_amount+' per '+esc(a.rate_period)+'</p>'+(a.message?'<p><strong>Message:</strong> '+esc(a.message)+'</p>':'')+(a.status==='pending'?'<button data-decision="approved" data-app="'+esc(a.id)+'">Approve</button> <button data-decision="declined" data-app="'+esc(a.id)+'">Decline</button>':'')+'</article>').join('')||'<p>No applications yet.</p>';host.querySelectorAll('[data-decision]').forEach(btn=>btn.onclick=async()=>{
 const action=btn.dataset.decision;
 const card=btn.closest('article');
 const buttons=card?.querySelectorAll('[data-decision]')||[];
 buttons.forEach(b=>b.disabled=true);
 try{
  await api('/projects/'+match[1]+'/role-applications/'+btn.dataset.app,{method:'PATCH',body:JSON.stringify({status:action})});
  const currentScroll=window.scrollY;
  activePage=''; // Force reload after a decision; the same-route guard otherwise leaves stale pending cards.
  await route();
  window.scrollTo(0,currentScroll);
 }catch(err){
  buttons.forEach(b=>b.disabled=false);
  if(/not pending|already decided/i.test(err.message)){
   const currentScroll=window.scrollY;
   activePage='';
   await route();
   window.scrollTo(0,currentScroll);
  }else alert(err.message);
 }
})}else {
 const host=document.getElementById('my-applications');
 const approvedOwnApps=apps.filter(a=>a.status==='approved');
 const privateSection=document.getElementById('private-application-status');
 if(privateSection)privateSection.hidden=!approvedOwnApps.length;
 host.innerHTML=approvedOwnApps.map(a=>'<div class="my-role-status" data-status="'+esc(a.status)+'"><strong>'+esc(a.item_name)+'</strong> <span class="my-role-badge">'+esc(a.status==='declined'?'Declined':a.status==='approved'?'Approved':a.status==='pending'?'Pending':a.status)+'</span> <span>Bid: $'+Number(a.rate_amount).toFixed(2)+' / '+esc(a.rate_period)+'</span>'+(a.status==='pending'?'<form class="edit-bid-form" data-application="'+esc(a.id)+'"><label>Revise your bid ($ USD) <input name="rate_amount" type="number" min="0" step="0.01" required value="'+Number(a.rate_amount).toFixed(2)+'"></label><button type="submit">Save revised bid</button><small role="status"></small></form>':'')+'</div>').join('');
 host.querySelectorAll('.edit-bid-form').forEach(form=>form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('button'),status=form.querySelector('[role="status"]');button.disabled=true;status.textContent='Saving…';
  try{
   await api('/projects/'+match[1]+'/role-applications/'+form.dataset.application,{method:'PUT',body:JSON.stringify({rate_amount:Number(form.elements.rate_amount.value)})});
   const currentScroll=window.scrollY;activePage='';await route();window.scrollTo(0,currentScroll);
  }catch(err){status.textContent=err.message;button.disabled=false}
 }));
}
if(p.is_owner){
 const controls=document.createElement('section');controls.className='owner-controls';controls.innerHTML='<h3>Manage your Collabo</h3><p id="owner-manage-feedback" role="status"></p><button id="owner-edit" type="button">Edit project / Save changes</button> <button id="owner-repost" type="button">Repost project</button> <button id="owner-pause" type="button">'+(p.status==='paused'?'Resume project':'Pause project')+'</button> <button id="owner-delete" type="button" style="color:#a21b1b">Delete project</button><div id="owner-edit-area" hidden></div>';
 root.prepend(controls);
 const feedback=controls.querySelector('#owner-manage-feedback'),editArea=controls.querySelector('#owner-edit-area');
 const locked=apps.length>0;
 if(locked){for(const id of ['owner-edit','owner-repost','owner-delete'])controls.querySelector('#'+id).hidden=true;feedback.textContent='Project locked: an application has been received. Editing, reposting and deletion are unavailable. You can pause or resume this Collabo.'}
 controls.querySelector('#owner-edit').onclick=()=>{
  editArea.hidden=false;
  editArea.innerHTML='<form id="owner-edit-form"><label>Project title<input name="title" maxlength="160" required></label><label>Description<textarea name="description" maxlength="5000" required rows="5"></textarea></label><label>Category<input name="category" required maxlength="80"></label><label>Location<input name="location" required maxlength="160"></label><label>Collaboration type<select name="collaboration_mode"><option>Local</option><option>Remote</option><option>Hybrid</option></select></label><button type="submit">Save changes</button></form>';
  const form=editArea.querySelector('form');for(const key of ['title','description','category','location','collaboration_mode'])form.elements[key].value=p[key]||'';
  form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;try{await api('/projects/'+match[1],{method:'PUT',body:JSON.stringify(Object.fromEntries(new FormData(form)))});feedback.textContent='Changes saved.';activePage=null;await route()}catch(err){feedback.textContent=err.message;button.disabled=false}};
 };
 controls.querySelector('#owner-repost').onclick=async()=>{if(!confirm('Repost this project and make it open for applications?'))return;try{await api('/projects/'+match[1],{method:'PUT',body:JSON.stringify({...p,repost:true})});activePage=null;await route()}catch(err){feedback.textContent=err.message}};
 controls.querySelector('#owner-pause').onclick=async()=>{const status=p.status==='paused'?'open':'paused';const reason=status==='paused'?await requestStatusReason('pause',p.title):'';if(status==='paused'&&!reason)return;try{await api('/projects/'+match[1],{method:'PATCH',body:JSON.stringify({status,reason})});activePage=null;await route()}catch(err){feedback.textContent=err.message}};
 controls.querySelector('#owner-delete').onclick=async()=>{if(!confirm('Permanently delete this project? This is only allowed before anyone applies.'))return;try{await api('/projects/'+match[1],{method:'DELETE'});location.hash='explore'}catch(err){feedback.textContent=err.message}};
}
// Guard against duplicate projection links from other page renderers.
const projectionLinks=[...main.querySelectorAll('button[data-route="projection/'+match[1]+'"]')];
projectionLinks.slice(1).forEach(button=>{const wrapper=button.closest('p.projection-link')||button.closest('p');if(wrapper&&wrapper.children.length===1)wrapper.remove();else button.remove()});
if(p.is_owner||apps.some(a=>a.status==='approved')){
 const chat=document.getElementById('team-chat');
 const projectCard=root.querySelector('article');
 if(projectCard)projectCard.appendChild(chat);
chat.innerHTML='<h3>Collabo Group Chat</h3><p id="chat-presence-count" role="status">Checking active members…</p><div id="chat-presence-dots" aria-label="Active group chat members" style="display:flex;gap:9px;flex-wrap:wrap;margin:12px 0"></div><button type="button" id="chat-first">Jump to First Message</button><button type="button" id="chat-latest">Latest Messages</button><div id="chat-messages" tabindex="-1" style="max-height:380px;overflow-y:auto;scroll-behavior:smooth">Loading…</div><div id="chat-reply-preview" hidden></div><form id="chat-form"><label>Team message<textarea name="message" maxlength="2000" required></textarea></label><button class="primary" type="submit">Send to team</button></form><button type="button" id="chat-refresh">Refresh messages</button>';const refresh=async(first=false)=>{try{const d=await api('/projects/'+match[1]+'/team-messages'+(first?'?first=1':''));document.getElementById('chat-messages').innerHTML=d.messages.map(m=>'<p data-chat-message="'+esc(m.id)+'"><strong>'+esc((m.sender_name&&m.sender_name!=='Name unavailable'?m.sender_name:'Name unavailable')+' — '+(m.sender_role||'Collaborator'))+':</strong> '+(m.reply_to_id?'<span class="cc-reply-quote" data-jump-to="'+esc(m.reply_to_id)+'" role="button" tabindex="0">↳ '+esc(m.reply_sender_name||'Collaborator')+': '+esc(m.reply_body||'Original message')+'</span>':'')+'<span class="cc-message-body">'+esc(m.body)+'</span>'+(m.edited_at?' <mark class="cc-edited-label">Edited</mark>':'')+' <small>'+esc(m.created_at)+'</small> '+(m.can_edit?'<button type="button" class="cc-edit-btn" data-edit-id="'+esc(m.id)+'">Edit</button>':'')+' <button type="button" class="cc-reply-btn" data-reply-id="'+esc(m.id)+'" data-reply-label="'+esc((m.sender_name||'Collaborator')+' — '+(m.sender_role||'Collaborator'))+'" data-reply-body="'+esc(m.body)+'">↩ Reply</button></p>').join('')||'<p>No messages yet.</p>';const pending=JSON.parse(sessionStorage.getItem('cc-pending-chat-target')||'null');if(pending?.projectId===match[1]){const box=document.getElementById('chat-messages');const target=pending.messageId?[...box.querySelectorAll('[data-chat-message]')].find(el=>el.dataset.chatMessage===pending.messageId):box.lastElementChild;if(target){sessionStorage.removeItem('cc-pending-chat-target');target.style.outline='3px solid #16a34a';target.style.background='#fff8d6';target.scrollIntoView({behavior:'smooth',block:'center'});box.scrollIntoView({behavior:'smooth',block:'center'})}else if(pending.messageId){box.insertAdjacentHTML('beforeend','<p role="status">This message is not among the latest 100 messages.</p>');sessionStorage.removeItem('cc-pending-chat-target')}}}catch(err){document.getElementById('chat-messages').textContent=err.message;if(err.message.includes('being configured')){document.getElementById('chat-form').hidden=true;document.getElementById('chat-refresh').hidden=true};if(err.message.includes('database is being set up')){document.getElementById('chat-form').querySelector('button').disabled=true;document.getElementById('chat-form').querySelector('textarea').disabled=true}}};let replyTarget=null;
const chatBox=document.getElementById('chat-messages');
chatBox.addEventListener('click',e=>{
 const reply=e.target.closest('[data-reply-id]');
 if(reply){replyTarget=reply.dataset.replyId;const preview=document.getElementById('chat-reply-preview');preview.hidden=false;preview.innerHTML='<strong>Replying to '+esc(reply.dataset.replyLabel)+'</strong><p>'+esc(reply.dataset.replyBody)+'</p><button type="button" id="chat-cancel-reply">Cancel reply</button>';preview.querySelector('button').onclick=()=>{replyTarget=null;preview.hidden=true};document.querySelector('#chat-form textarea').focus();return}
 const quote=e.target.closest('[data-jump-to]');
 if(quote){const target=[...chatBox.querySelectorAll('[data-chat-message]')].find(x=>x.dataset.chatMessage===quote.dataset.jumpTo);if(target){target.scrollIntoView({block:'center',behavior:'smooth'});target.style.outline='2px solid #15803d'}else alert('Original message is older than the currently loaded messages. Open chat history to find it.')}
});
let longPressTimer=null,longPressStart=null;
function openMessageEditor(message){
 const id=message.dataset.chatMessage;
 if(!message.querySelector('[data-edit-id]'))return;
 const bodyEl=message.querySelector('.cc-message-body');
 const original=bodyEl?.textContent||'';
 if(!bodyEl||message.querySelector('.cc-edit-form'))return;
 const form=document.createElement('form');form.className='cc-edit-form';
 form.innerHTML='<label>Edit your message<textarea maxlength="2000" required></textarea></label><button type="submit">Save</button><button type="button" class="cc-cancel-edit">Cancel</button><p role="alert"></p>';
 const field=form.querySelector('textarea');field.value=original;
 bodyEl.hidden=true;bodyEl.after(form);field.focus();
 const cancel=()=>{form.remove();bodyEl.hidden=false};
 form.querySelector('.cc-cancel-edit').onclick=cancel;
 form.onsubmit=async event=>{event.preventDefault();try{await api('/projects/'+match[1]+'/team-messages/'+id,{method:'PATCH',body:JSON.stringify({message:field.value})});await refresh()}catch(error){form.querySelector('[role="alert"]').textContent=error.message}};
}
// Swipe right to reply; vertical scrolling and long-press editing remain independent.
let replySwipe=null;
chatBox.addEventListener('touchstart',e=>{
 if(e.touches.length!==1||e.target.closest('button,textarea,input,select,[data-jump-to],.cc-edit-form'))return;
 const message=e.target.closest('[data-chat-message]');
 if(!message)return;
 const touch=e.touches[0];
 replySwipe={message,x:touch.clientX,y:touch.clientY,dx:0,vertical:false};
},{passive:true});
chatBox.addEventListener('touchmove',e=>{
 if(!replySwipe||e.touches.length!==1)return;
 const touch=e.touches[0],dx=touch.clientX-replySwipe.x,dy=touch.clientY-replySwipe.y;
 if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){replySwipe.vertical=true;replySwipe.message.style.transform='';return}
 if(!replySwipe.vertical&&dx>0&&dx>Math.abs(dy)*1.4){
  replySwipe.dx=dx;
  replySwipe.message.style.transition='none';
  replySwipe.message.style.transform='translateX('+Math.min(dx,65)+'px)';
 }
},{passive:true});
chatBox.addEventListener('touchend',()=>{
 if(!replySwipe)return;
 const gesture=replySwipe;replySwipe=null;
 gesture.message.style.transition='transform 160ms ease';
 gesture.message.style.transform='';
 if(gesture.vertical||gesture.dx<55)return;
 clearTimeout(longPressTimer);
 const button=gesture.message.querySelector('[data-reply-id]');
 if(button)button.click();
},{passive:true});
chatBox.addEventListener('touchcancel',()=>{
 if(replySwipe){replySwipe.message.style.transform='';replySwipe=null}
},{passive:true});
chatBox.addEventListener('click',e=>{const button=e.target.closest('[data-edit-id]');if(button)openMessageEditor(button.closest('[data-chat-message]'))});
chatBox.addEventListener('touchstart',e=>{const m=e.target.closest('[data-chat-message]');if(!m||!m.querySelector('[data-edit-id]')||e.target.closest('button,textarea,[data-jump-to]'))return;const t=e.touches[0];longPressStart={x:t.clientX,y:t.clientY};clearTimeout(longPressTimer);longPressTimer=setTimeout(()=>{longPressTimer=null;openMessageEditor(m)},650)},{passive:true});
chatBox.addEventListener('touchmove',e=>{if(longPressStart&&e.touches.length){const t=e.touches[0];if(Math.hypot(t.clientX-longPressStart.x,t.clientY-longPressStart.y)>12)clearTimeout(longPressTimer)}},{passive:true});
for(const eventName of ['touchend','touchcancel'])chatBox.addEventListener(eventName,()=>{clearTimeout(longPressTimer);longPressStart=null},{passive:true});
chatBox.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-jump-to]')){e.preventDefault();e.target.click()}});
const presenceDots=document.getElementById('chat-presence-dots');
const presenceCount=document.getElementById('chat-presence-count');
let presenceTimer=null;
const updatePresence=async()=>{
 if(!document.getElementById('team-chat')?.isConnected){if(presenceTimer)clearInterval(presenceTimer);return}
 try{
  const d=await api('/projects/'+match[1]+'/team-presence',{method:'POST',body:JSON.stringify({active:!document.hidden})});
  presenceCount.textContent=d.collaborators_joined+' approved collaborator'+(d.collaborators_joined===1?'':'s')+' joined · '+d.active.length+' active in chat';
  presenceDots.innerHTML=d.active.map(m=>{const label=m.role==='initiator'?'Initiator':String(m.label||'Role not specified');const color=m.role==='initiator'?'#dc2626':'#16a34a';return '<span title="'+esc(label)+' active" aria-label="'+esc(label)+' active" style="display:inline-flex;align-items:center;gap:6px;border:1px solid '+color+';border-radius:18px;padding:5px 9px;font-weight:600;font-size:13.8px"><span aria-hidden="true" style="width:13px;height:13px;flex-shrink:0;border-radius:50%;background:'+color+'"></span>'+esc(label)+'</span>'}).join('');
 }catch(e){presenceCount.textContent='Member activity temporarily unavailable'}
};
updatePresence();presenceTimer=setInterval(updatePresence,12000);
document.getElementById('chat-first').onclick=async()=>{await refresh(true);const list=document.getElementById('chat-messages');list.scrollTop=0;list.focus()};
document.getElementById('chat-latest').onclick=async()=>{await refresh(false);const list=document.getElementById('chat-messages');list.scrollTop=list.scrollHeight;list.focus()};
document.getElementById('chat-refresh').onclick=()=>refresh(false);document.getElementById('chat-form').elements.message.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!e.repeat){e.preventDefault();const form=e.currentTarget.form;if(!form.querySelector('button[type="submit"]').disabled&&e.currentTarget.value.trim())form.requestSubmit()}});document.getElementById('chat-form').onsubmit=async e=>{e.preventDefault();const field=e.currentTarget.elements.message;try{await api('/projects/'+match[1]+'/team-messages',{method:'POST',body:JSON.stringify({message:field.value,reply_to_id:replyTarget})});field.value='';replyTarget=null;document.getElementById('chat-reply-preview').hidden=true;await refresh()}catch(err){if(err.message.includes('being configured')){document.getElementById('chat-form').hidden=true;document.getElementById('chat-refresh').hidden=true;document.getElementById('chat-messages').textContent=err.message}else alert(err.message)}};refresh()}
}catch(err){document.getElementById('project-details').textContent=err.message}return}
location.hash='home'}
document.addEventListener('click',e=>{const routeButton=e.target.closest('[data-route]');if(routeButton){e.preventDefault();if(location.hash==='#'+routeButton.dataset.route)route();else location.hash=routeButton.dataset.route;return}const p=e.target.closest('[data-project]');if(p){e.preventDefault();location.hash='project/'+p.dataset.project;return}if(e.target.closest('#initiate')){e.preventDefault();location.hash='post'}if(e.target.closest('#explore')){e.preventDefault();location.hash='explore'}});
// Bottom-of-screen navigation for long pages, including project details and application forms.
const bottomBack=document.createElement('div');
bottomBack.id='cc-bottom-back';
bottomBack.style.cssText='max-width:1100px;margin:12px auto 24px;padding:0 18px;text-align:left';
bottomBack.innerHTML='<button type="button" id="cc-bottom-back-button" style="background:#12643e;color:white;border:0;border-radius:9px;padding:12px 22px;font-weight:700;cursor:pointer;min-height:44px">← Back</button>';
main.insertAdjacentElement('afterend',bottomBack);
const internalPageHistory=[];
let previousInternalPage=location.hash||'#home';
function syncBottomBack(){
 const current=location.hash||'#home';
 bottomBack.hidden=current==='#home';
}
function trackInternalNavigation(){
 const current=location.hash||'#home';
 if(current!==previousInternalPage){
  internalPageHistory.push(previousInternalPage);
  if(internalPageHistory.length>30)internalPageHistory.shift();
  previousInternalPage=current;
 }
 syncBottomBack();
}
bottomBack.querySelector('button').addEventListener('click',()=>{
 const current=location.hash||'#home';
 let target=internalPageHistory.pop();
 while(target===current&&internalPageHistory.length)target=internalPageHistory.pop();
 if(!target||target===current)target=current.startsWith('#project/')?'#explore':'#home';
 previousInternalPage=target;
 location.hash=target;
 if(location.hash===target)route();
 window.scrollTo({top:0,behavior:'instant'});
});
window.addEventListener('hashchange',trackInternalNavigation);
syncBottomBack();
window.addEventListener('hashchange',route);
// Authentication updates must not destroy a guest's in-progress form or browsing screen.
let lastAuthIdentity=window.Clerk?.user?.id||null;
window.addEventListener('cloudcollabo-auth-changed',()=>{
 const identity=window.Clerk?.user?.id||null;
 if(identity===lastAuthIdentity)return;
 lastAuthIdentity=identity;
 if(activePage==='post'&&main.querySelector('#project-form'))return;
 if(activePage==='explore'&&main.querySelector('#project-filter'))return;
 route();
});
route();
})();