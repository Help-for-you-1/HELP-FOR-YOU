/* HELP FOR YOU — View button only fix */
(()=>{
'use strict';
function openView(i){
  const n=Number(i);
  const rows=window.__HFY_APPLICATIONS||[];
  if(!rows[n]){alert('Application not found.');return false;}
  if(typeof window.editApproval==='function'){
    window.editApproval(n);
    return false;
  }
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
      ev.preventDefault();
      ev.stopPropagation();
      openView(m[1]);
    },true);
  });
}
function boot(){
  bind();
  const body=document.getElementById('appsRows');
  if(body&&!body.__hfyViewObserver){
    const ob=new MutationObserver(()=>bind());
    ob.observe(body,{childList:true,subtree:true});
    body.__hfyViewObserver=true;
  }
  window.viewApp=openView;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
[100,300,600,1000,1500,2500,4000].forEach(t=>setTimeout(bind,t));
})();