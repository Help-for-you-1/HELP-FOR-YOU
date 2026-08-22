(()=>{
'use strict';
const escF=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyF=v=>'₹'+Number(v||0).toFixed(2);
const todayF=()=>new Date().toISOString().slice(0,10);
async function viewEmiFinal(i){
 try{
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const q=await sb.from('loan_emi_schedule').select('*').order('due_date',{ascending:true});
  if(q.error)throw q.error;
  const all=q.data||[], row=all[i]; if(!row)return alert('EMI record not found.');
  const loanId=row.loan_id, list=all.filter(x=>String(x.loan_id)===String(loanId));
  let customer={}; const c=await sb.from('customers').select('full_name,mobile').eq('id',row.customer_id).maybeSingle(); if(c.error)throw c.error; customer=c.data||{};
  let total=0,paid=0,remaining=0,penalty=0,pc=0,pending=0,overdue=0;
  const rows=list.map(e=>{
   const a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),due=a+p,rem=Math.max(0,due-pa); let s=String(e.status||'pending').toLowerCase();
   if(s!=='paid'&&rem>0&&String(e.due_date||'')<todayF())s='overdue';
   total+=due;paid+=pa;remaining+=rem;penalty+=p;if(s==='paid')pc++;else if(s==='overdue')overdue++;else pending++;
   const act=s==='paid'?'<span class="paid"><b>Paid</b></span>':`<button class="btn green" onclick="emiFinalPaid('${escF(e.id)}')">Paid</button>`;
   return `<tr><td>${escF(e.emi_number)}</td><td>${escF(String(e.due_date||'').slice(0,10))}</td><td>${moneyF(a)}</td><td>${moneyF(p)}</td><td>${moneyF(due)}</td><td>${moneyF(pa)}</td><td>${moneyF(rem)}</td><td>${escF(s)}</td><td>${act}</td></tr>`;
  }).join('');
  window.openBox('EMI / Repayment — Full EMI List',`<p><b>Customer:</b> ${escF(customer.full_name||'-')} &nbsp; <b>Mobile:</b> ${escF(customer.mobile||'-')} &nbsp; <b>Loan ID:</b> ${escF(loanId)}</p><div class="wrap"><table style="min-width:1100px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows||'<tr><td colspan="9">No EMI schedule found.</td></tr>'}</tbody></table></div><p><b>Total EMI:</b> ${list.length} &nbsp; <b>Paid:</b> ${pc} &nbsp; <b>Pending:</b> ${pending} &nbsp; <b>Overdue:</b> ${overdue} &nbsp; <b>Total Paid:</b> ${moneyF(paid)} &nbsp; <b>Remaining:</b> ${moneyF(remaining)} &nbsp; <b>Penalty:</b> ${moneyF(penalty)} &nbsp; <b>Total Due:</b> ${moneyF(total)}</p>`);
 }catch(e){console.error(e);alert('EMI list load failed: '+(e?.message||e));}
}
window.emiFinalPaid=async function(id){try{const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);const q=await sb.from('loan_emi_schedule').select('*').eq('id',id).single();if(q.error)throw q.error;const e=q.data,total=Number(e.emi_amount||0)+Number(e.penalty||0);const u=await sb.from('loan_emi_schedule').update({total_due:total,paid_amount:total,remaining_amount:0,status:'paid'}).eq('id',id);if(u.error)throw u.error;window.closeM();if(window.loadData)await window.loadData();alert('EMI marked as Paid successfully.');}catch(e){console.error(e);alert('EMI Payment error: '+(e?.message||e));}};
window.viewEmi=viewEmiFinal;
})();
