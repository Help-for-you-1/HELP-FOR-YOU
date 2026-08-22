/* HELP FOR YOU — Approval display fix only.
   Does not remove or change any existing Admin option.
*/
(function(){
'use strict';
function boot(){
  if(!window.supabase || !window.HFY_SUPABASE_URL || !window.HFY_SUPABASE_PUBLISHABLE_KEY) return;
  var sb=window.HFY_ADMIN_SB || window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  window.HFY_ADMIN_SB=sb;
  sb.from('loan_applications').select('*').order('created_at',{ascending:false}).then(function(r){
    if(r.error){console.error('Approval load:',r.error);return;}
    var rows=r.data||[];
    if(window.HFY_ADMIN_DB) window.HFY_ADMIN_DB.applications=rows.map(function(x){return Object.assign({},x,{name:x.name||x.full_name||'',amount:Number(x.requested_amount!=null?x.requested_amount:(x.loan_amount||0)),date:x.created_at?x.created_at.slice(0,10):''});});
    var body=document.getElementById('apRows');
    if(!body)return;
    var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
    var money=function(v){return Number(v||0).toFixed(2);};
    var pending=rows.map(function(x,i){
      var s=String(x.status||'pending').toLowerCase().trim();
      if(['approved','rejected','disbursed','active','completed','cancelled'].includes(s))return '';
      return '<tr><td>'+esc(x.name||x.full_name)+'</td><td>'+esc(x.mobile)+'</td><td>'+esc(x.created_at?x.created_at.slice(0,10):'')+'</td><td>₹'+money(x.requested_amount!=null?x.requested_amount:x.loan_amount)+'</td><td class="pending">Pending for Approval</td><td><button class="btn blue" onclick="editApproval('+i+')">Edit</button></td></tr>';
    }).join('');
    body.innerHTML=pending||'<tr><td colspan="6">No pending approval.</td></tr>';
    if(window.render)window.render();
  }).catch(function(e){console.error('Approval load:',e);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1200);});else setTimeout(boot,1200);
})();
