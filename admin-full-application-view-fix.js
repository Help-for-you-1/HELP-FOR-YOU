/* HELP FOR YOU — View button only fix */
(()=>{
'use strict';
let loading=false;
function loadEditor(){
  if(typeof window.editApproval==='function')return Promise.resolve(true);
  if(loading)return new Promise(resolve=>setTimeout(()=>resolve(typeof window.editApproval==='function'),300));
  loading=true;
  return new Promise(resolve=>{
    const s=document.createElement('script');
    s.src='admin-core.js?v=20260927-11';
    s.onload=()=>{loading=false;resolve(typeof window.editApproval==='function');};
    s.onerror=()=>{loading=false;resolve(false);};
    document.head.appendChild(s);
  });
}
async function openView(i){
  const n=Number(i),rows=window.__HFY_APPLICATIONS||[];
  if(!rows[n]){alert('Application not found.');return false;}
  if(typeof window.editApproval!=='function')await loadEditor();
  if(typeof window.editApproval==='function'){window.editApproval(n);return false;}
  alert('Full Application editor is not loaded. Please refresh the Admin Panel.');
  return false;
}
function bind(){
  const body=document.getElementById('appsRows');
  if(!body)return;
  body.querySelectorAll('button').forEach(btn=>{
    const raw=btn.getAttribute('onclick')||'';
    const m=raw.match(/viewApp\((\d+)\)/);
    if(!m)return;
    btn.onclick=null;
    btn.removeAttribute('onclick');
    btn.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopPropagation();
      openView(m[1]);
    },true);
  });
  window.viewApp=openView;
}
function boot(){
  bind();
  const body=document.getElementById('appsRows');
  if(body&&!body.__hfyViewObserver){
    const ob=new MutationObserver(bind);
    ob.observe(body,{childList:true,subtree:true});
    body.__hfyViewObserver=true;
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
[100,300,600,1000,1500,2500,4000].forEach(t=>setTimeout(bind,t));
})();