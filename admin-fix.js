/* HELP FOR YOU - admin runtime fix
   Keeps existing UI and Supabase configuration unchanged.
   Repairs admin navigation/actions and Approval row indexing.
*/
(function(){
  'use strict';

  function pendingIndexes(){
    var apps=window.db && Array.isArray(window.db.applications)?window.db.applications:[];
    var out=[];
    apps.forEach(function(x,i){
      var s=String(x.status||'').toLowerCase();
      if(['approved','rejected','disbursed'].indexOf(s)===-1) out.push(i);
    });
    return out;
  }

  function repair(){
    try{
      if(typeof db!=='undefined' && !window.db) window.db=db;
    }catch(e){}

    var rows=document.querySelectorAll('#apRows tr');
    var pending=pendingIndexes();
    rows.forEach(function(row,n){
      var btn=row.querySelector('button');
      if(btn && pending[n]!==undefined){
        btn.onclick=function(){
          if(typeof window.editApproval==='function') window.editApproval(pending[n]);
        };
      }
    });
  }

  document.addEventListener('click',function(ev){
    var el=ev.target.closest ? ev.target.closest('.m') : null;
    if(!el) return;
    var attr=el.getAttribute('onclick')||'';
    var m=attr.match(/^show\(['\"]([^'\"]+)['\"],this\)$/);
    if(m && typeof window.show==='function'){
      ev.preventDefault();
      window.show(m[1],el);
    }
  },true);

  var timer=setInterval(repair,300);
  document.addEventListener('DOMContentLoaded',repair);
  window.addEventListener('load',repair);
  window.addEventListener('beforeunload',function(){clearInterval(timer);});
})();
