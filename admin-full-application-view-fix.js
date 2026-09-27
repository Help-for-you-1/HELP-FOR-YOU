/* HELP FOR YOU — Final full Application View/Edit binding
   Keeps existing application list and opens the existing full editable form. */
(()=>{
'use strict';
function bindFullApplicationView(){
  const old=window.viewApp;
  window.viewApp=function(i){
    const rows=window.__HFY_APPLICATIONS||[];
    if(!rows[i]){alert('Application not found.');return;}
    if(typeof window.editApproval==='function'){
      window.editApproval(Number(i));
      return;
    }
    alert('Full Application editor is not loaded. Please refresh the Admin Panel.');
  };
  document.querySelectorAll('#appsRows button[onclick*="viewApp"]').forEach(btn=>{
    const raw=btn.getAttribute('onclick')||'';
    const m=raw.match(/viewApp\((\d+)\)/);
    if(m){
      btn.onclick=function(ev){
        if(ev)ev.preventDefault();
        window.viewApp(Number(m[1]));
        return false;
      };
      btn.removeAttribute('onclick');
    }
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindFullApplicationView);
else bindFullApplicationView();
setTimeout(bindFullApplicationView,500);
setTimeout(bindFullApplicationView,1500);
})();
