/* HELP FOR YOU — Final full Application View/Edit binding
   Keeps existing application list and opens the existing full editable form. */
(()=>{
'use strict';
let loadingCore=false;

function loadCoreEditor(){
  if(typeof window.editApproval==='function') return Promise.resolve(true);
  if(loadingCore) return new Promise(resolve=>setTimeout(()=>resolve(typeof window.editApproval==='function'),250));
  loadingCore=true;
  return new Promise(resolve=>{
    const s=document.createElement('script');
    s.src='admin-core.js?v=20260927-10';
    s.onload=()=>{loadingCore=false;resolve(typeof window.editApproval==='function');};
    s.onerror=()=>{loadingCore=false;resolve(false);};
    document.head.appendChild(s);
  });
}

async function openFullEditor(i){
  const rows=window.__HFY_APPLICATIONS||[];
  if(!rows[i]){alert('Application not found.');return;}
  if(typeof window.editApproval!=='function'){
    await loadCoreEditor();
  }
  if(typeof window.editApproval==='function'){
    window.editApproval(Number(i));
    return;
  }
  alert('Full Application editor is not loaded. Please refresh the Admin Panel.');
}

function bindButtons(){
  document.querySelectorAll('#appsRows button[onclick*="viewApp"]').forEach(btn=>{
    const raw=btn.getAttribute('onclick')||'';
    const m=raw.match(/viewApp\((\d+)\)/);
    if(m){
      btn.onclick=function(ev){
        if(ev)ev.preventDefault();
        openFullEditor(Number(m[1]));
        return false;
      };
      btn.removeAttribute('onclick');
    }
  });
}

function bind(){
  window.viewApp=function(i){openFullEditor(Number(i));};
  bindButtons();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
else bind();

[100,300,600,1000,1500,2500,4000].forEach(t=>setTimeout(bind, t));
})();