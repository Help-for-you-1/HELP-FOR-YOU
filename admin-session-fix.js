/* HELP FOR YOU — admin session/data fix */
(function(){
'use strict';
function id(x){return document.getElementById(x);}
function money(v){return Number(v||0).toFixed(2);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
async function start(){
 var sb=window.HFY_ADMIN_SB;
 if(!sb&&window.supabase&&window.HFY_SUPABASE_URL&&window.HFY_SUPABASE_PUBLISHABLE_KEY) sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
 if(!sb)return;
 window.HFY_ADMIN_SB=sb;
 var s=await sb.auth.getSession();
 if(s.error)throw s.error;
 if(!s.data.session){alert('Admin login session is not active. Please login again.');location.href='login.html';return;}
 var p=await sb.from('profiles').select('role,status').eq('id',s.data.session.user.id).maybeSingle();
 if(p.error)throw p.error;
 if(!p.data||String(p.data.role).toLowerCase()!=='admin'||String(p.data.status||'active').toLowerCase()!=='active'){await sb.auth.signOut();alert('This account is not an active admin.');location.href='login.html';return;}
 var r=await Promise.all([
  sb.from('loan_applications').select('*').order('created_at',{ascending:false}),
  sb.from('customers').select('*').order('created_at',{ascending:false}),
  sb.from('loan_accounts').select('*').order('created_at',{ascending:false}),
  sb.from('loan_emi_schedule').select('*').order('due_date',{ascending:true})
 ]);
 for(var i=0;i<r.length;i++)if(r[i].error)throw r[i].error;
 var cm=new Map((r[1].data||[]).map(function(c){return[c.id,c];}));
 window.db={applications:(r[0].data||[]).map(function(x){return Object.assign({},x,{name:x.name||x.full_name||'',mobile:x.mobile||'',amount:Number(x.requested_amount!=null?x.requested_amount:(x.loan_amount||0)),date:x.created_at?x.created_at.slice(0,10):'',kyc:x.kyc_status||''});}),customers:[],emis:(r[3].data||[]).map(function(e){var due=e.due_date,today=new Date();today.setHours(0,0,0,0);return{id:e.id,loanId:String(e.loan_id||''),customer:(cm.get(e.customer_id)||{}).full_name||'',no:e.emi_number,due:due,amount:Number(e.emi_amount||0),days:due?Math.max(0,Math.floor((today-new Date(due+'T00:00:00'))/86400000)):0,penalty:Number(e.penalty||0),paid:Number(e.paid_amount||0),status:e.status||'pending'};})};
 window.db.customers=(r[2].data||[]).map(function(l){var c=cm.get(l.customer_id)||{},es=window.db.emis.filter(function(e){return String(e.loanId)===String(l.loan_id);});return{id:c.id,name:c.full_name||'',mobile:c.mobile||'',loanId:String(l.loan_id),amount:Number(l.loan_amount||0),months:Number(l.tenure_months||0),emi:Number(l.daily_emi||0)*30,overdue:es.reduce(function(a,e){return a+e.penalty;},0),totalDue:es.length?es.reduce(function(a,e){return a+Math.max(0,e.amount+e.penalty-e.paid);},0):Number(l.remaining_amount||0),sanction:l.start_date||'',customerId:c.id,accountId:l.id,email:c.email||'',pan:c.pan_number||'',aadhaar:c.aadhaar_number||'',state:c.state||'',district:c.district||'',pincode:c.pincode||'',address:c.address||''};});
 if(window.render)window.render();
}
window.addEventListener('load',function(){start().catch(function(e){console.error(e);alert('Admin data load error: '+(e.message||e));});});
})();
