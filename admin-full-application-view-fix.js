/* HELP FOR YOU — Final Application View/Edit click fix */
(()=>{
'use strict';
let busy=false;

function openEditor(i){
  if(busy)return;
  const rows=window.__HFY_APPLICATIONS||[];
  const idx=Number(i);
  if(!rows[idx]){alert('Application not found.');return;}
  if(typeof window.editApproval==='function'){
    window.editApproval(idx);
    return;
  }
  alert('Full Application editor is not loaded. Please refresh the Admin Panel.');
}

function handleClick(ev){
  const target=ev.target&&ev.target.closest ? ev.target.closest('#appsRows button') : null;
  if(!target)return;
  const raw=target.getAttribute('onclick')||'';
  const m=raw.match(/viewApp\((\d+)\)/);
  if(!m)return;
  ev.preventDefault();
  ev.stopPropagation();
  if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
  openEditor(m[1]);
}

function bind(){
  if(window.__HFY_FULL_APP_CAPTURE)return;
  window.__HFY_FULL_APP_CAPTURE=true;
  document.addEventListener('click',handleClick,true);
  window.viewApp=function(i){openEditor(i);};
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
else bind();
})();