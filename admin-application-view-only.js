/* HELP FOR YOU — Application View only */
(()=>{
'use strict';
function view(i){
 const rows=window.__HFY_APPLICATIONS||[],x=rows[Number(i)];
 if(!x){alert('Application not found.');return;}
 if(typeof window.editApproval==='function'){window.editApproval(Number(i));return;}
 alert('Application editor is unavailable.');
}
window.viewApp=view;
})();
