/* HELP FOR YOU - targeted admin fix
   Does not change the existing design or Supabase configuration.
   Fixes Approval-row indexing so Edit/Approve always opens the correct application.
*/
(function(){
  function fixApprovalButtons(){
    const rows=document.querySelectorAll('#apRows tr');
    const apps=Array.isArray(window.db?.applications)?window.db.applications:[];
    let pending=[];
    apps.forEach(function(x,i){
      const s=String(x.status||'').toLowerCase();
      if(!['approved','rejected','disbursed'].includes(s)) pending.push(i);
    });
    rows.forEach(function(row,n){
      const btn=row.querySelector('button');
      if(btn && pending[n]!==undefined){
        btn.setAttribute('onclick','editApproval('+pending[n]+')');
      }
    });
  }
  const timer=setInterval(function(){
    if(document.getElementById('apRows')) fixApprovalButtons();
  },500);
  window.addEventListener('beforeunload',function(){clearInterval(timer)});
})();
