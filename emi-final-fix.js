/* HELP FOR YOU — FINAL EMI FIX ONLY
   Keeps the existing Admin UI. Replaces only EMI View + EMI actions.
*/
(function(){
'use strict';
function C(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY)}
function E(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function M(v){return Number(v||0).toFixed(2)}
function S(e){var s=String(e.status||'pending').toLowerCase();if(s==='paid')return'paid';if(s==='overdue')return'overdue';return String(e.due_date||'')<new Date().toISOString().slice(0,10)?'overdue':'pending'}

async function loadEmis(loanId){var r=await C().from('loan_emi_schedule').select('*').eq('loan_id',loanId).order('emi_number',{ascending:true});if(r.error)throw r.error;return r.data||[]}

function showList(c,es){
 var paid=0,pending=0,overdue=0,total=0,paidAmt=0,remaining=0,penalty=0;
 es.forEach(function(e){var s=S(e),a=+e.emi_amount||0,p=+e.penalty||0,pa=+e.paid_amount||0,r=Math.max(0,a+p-pa);total+=a+p;paidAmt+=pa;remaining+=r;penalty+=p;if(s==='paid')paid++;else if(s==='overdue')overdue++;else pending++});
 var rows=es.map(function(e){var s=S(e),a=+e.emi_amount||0,p=+e.penalty||0,pa=+e.paid_amount||0,r=Math.max(0,a+p-pa);return '<tr><td>'+E(e.emi_number)+'</td><td>'+E(String(e.due_date||'').slice(0,10))+'</td><td>₹'+M(a)+'</td><td>₹'+M(p)+'</td><td>₹'+M(a+p)+'</td><td>₹'+M(pa)+'</td><td>₹'+M(r)+'</td><td class="'+(s==='paid'?'paid':s==='overdue'?'over':'pending')+'"><b>'+s+'</b></td><td>'+(s==='paid'?'<span class="paid"><b>Paid</b></span>':'<button class="btn '+(s==='overdue'?'red':'green')+'" onclick="hfyPay(\''+E(e.id)+'\')">Paid</button>')+' <button class="btn gray" onclick="hfyEditEmi(\''+E(e.id)+'\')">Edit</button></td></tr>'}).join('');
 openBox('EMI Schedule — '+E(c.loanId),'<p><b>'+E(c.name)+'</b> | Mobile: '+E(c.mobile)+' | Sanction Date: '+E(c.sanction)+'</p><div class="wrap"><table style="min-width:1100px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>'+(rows||'<tr><td colspan="9">No EMI schedule found.</td></tr>')+'</tbody></table></div><p><b>Total EMI:</b> '+es.length+' &nbsp; <b>Paid:</b> '+paid+' &nbsp; <b>Pending:</b> '+pending+' &nbsp; <b>Overdue:</b> '+overdue+' &nbsp; <b>Total Paid:</b> ₹'+M(paidAmt)+' &nbsp; <b>Remaining:</b> ₹'+M(remaining)+' &nbsp; <b>Penalty:</b> ₹'+M(penalty)+' &nbsp; <b>Total Due:</b> ₹'+M(total)+'</p>')
}

window.viewRepay=function(i){(async function(){try{var c=window.db&&db.customers&&db.customers[i];if(!c||!c.loanId){alert('Loan ID not found.');return}var es=await loadEmis(c.loanId);showList(c,es)}catch(e){console.error(e);alert('EMI list load failed: '+(e.message||e))}})()};

window.hfyPay=async function(id){try{var sb=C(),r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('EMI not found');var e=r.data;if(String(e.status).toLowerCase()==='paid'){alert('This EMI is already paid.');return}var total=(+e.emi_amount||0)+(+e.penalty||0);var u=await sb.from('loan_emi_schedule').update({total_due:total,paid_amount:total,remaining_amount:0,status:'paid'}).eq('id',id);if(u.error)throw u.error;if(window.loadData)await window.loadData();closeM();alert('EMI marked as Paid successfully')}catch(e){alert('Payment update failed: '+(e.message||e))}};
window.pay=window.hfyPay;

window.hfyEditEmi=async function(id){try{var r=await C().from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('EMI not found');var e=r.data,s=String(e.status||'pending').toLowerCase();openBox('Edit EMI','<div class="form"><label>EMI Number<input value="'+E(e.emi_number)+'" readonly></label><label>Due Date<input id="efDue" type="date" value="'+E(String(e.due_date||'').slice(0,10))+'"></label><label>EMI Amount<input id="efAmt" type="number" step="0.01" value="'+(+e.emi_amount||0)+'"></label><label>Penalty<input id="efPen" type="number" step="0.01" value="'+(+e.penalty||0)+'"></label><label>Paid Amount<input id="efPaid" type="number" step="0.01" value="'+(+e.paid_amount||0)+'"></label><label>Status<select id="efStatus"><option value="pending" '+(s==='pending'?'selected':'')+'>Pending</option><option value="overdue" '+(s==='overdue'?'selected':'')+'>Overdue</option><option value="paid" '+(s==='paid'?'selected':'')+'>Paid</option></select></label><div class="full"><button class="btn blue" onclick="hfySaveEmi(\''+E(id)+'\')">Save Changes</button></div></div>')}catch(e){alert('EMI edit load failed: '+(e.message||e))}};
window.editEmi=window.hfyEditEmi;
window.hfySaveEmi=async function(id){try{var a=+efAmt.value||0,p=+efPen.value||0,pa=+efPaid.value||0,d=efDue.value,s=efStatus.value;if(a<=0)throw new Error('EMI amount must be greater than 0');if(!d)throw new Error('Due Date is required');var t=a+p;if(s==='paid')pa=t;pa=Math.min(Math.max(pa,0),t);var r=await C().from('loan_emi_schedule').update({due_date:d,emi_amount:a,penalty:p,total_due:t,paid_amount:pa,remaining_amount:Math.max(0,t-pa),status:s}).eq('id',id);if(r.error)throw r.error;if(window.loadData)await window.loadData();closeM();alert('EMI updated successfully')}catch(e){alert('EMI update failed: '+(e.message||e))}};
window.updateEmi=window.hfySaveEmi;
})();
