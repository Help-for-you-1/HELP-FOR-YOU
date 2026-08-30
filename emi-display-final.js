(()=>{
'use strict';
const escD=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyD=v=>'₹'+Number(v||0).toFixed(2);
window.viewLoanEmi=async function(i){
 try{
  const loan=(window.__emiLoanRows||[])[i];if(!loan)return alert('Loan record not found.');
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const q=await sb.from('loan_emi_schedule').select('*').eq('loan_id',loan.loan_id).order('due_date',{ascending:true});
  if(q.error)throw q.error;
  const es=q.data||[];
  const c=await sb.from('customers').select('full_name,mobile').eq('id',loan.customer_id).maybeSingle();if(c.error)throw c.error;
  const loanTotal=es.reduce((n,e)=>n+Number(e.emi_amount||0)+Number(e.penalty||0),0);
  let paidTotal=0,penalty=0,paidCount=0,pending=0,overdue=0;
  const html=es.map(e=>{
   const a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),emiDue=a+p,remaining=Math.max(0,emiDue-pa);
   let s=String(e.status||'pending').toLowerCase();
   if(s!=='paid'&&remaining>0&&String(e.due_date||'').slice(0,10)<new Date().toISOString().slice(0,10))s='overdue';
   paidTotal+=pa;penalty+=p;if(s==='paid')paidCount++;else if(s==='overdue')overdue++;else pending++;
   const totalDueBalance=Math.max(0,loanTotal-paidTotal);
   const action=s==='paid'?`<button class="btn red" onclick="hfyMarkEmiUnpaid('${escD(e.id)}')">Mark Unpaid</button>`:`<button class="btn green" onclick="hfyPay('${escD(e.id)}')">Pay Now</button>`;
   return `<tr><td>${escD(e.emi_number)}</td><td>${escD(String(e.due_date||'').slice(0,10))}</td><td>${moneyD(a)}</td><td>${moneyD(p)}</td><td>${moneyD(totalDueBalance)}</td><td>${moneyD(pa)}</td><td>${moneyD(remaining)}</td><td class="${s==='paid'?'paid':s==='overdue'?'over':'pending'}">${escD(s)}</td><td>${action}</td></tr>`;
  }).join('');
  const balance=Math.max(0,loanTotal-paidTotal);
  window.openBox('Full EMI List',`<p><b>Name:</b> ${escD(c.data?.full_name||'-')} &nbsp; <b>Loan ID:</b> ${escD(loan.loan_id||'-')} &nbsp; <b>Mobile:</b> ${escD(c.data?.mobile||'-')} &nbsp; <b>Sanction Loan:</b> ${moneyD(loan.loan_amount)} &nbsp; <b>Total Loan:</b> ${moneyD(loanTotal)} &nbsp; <b>Sanction Date:</b> ${escD(loan.start_date||'-')}</p><div class="wrap"><table style="min-width:1200px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${html||'<tr><td colspan="9">No EMI schedule found.</td></tr>'}</tbody></table></div><p><b>Total EMI:</b> ${es.length} &nbsp; <b>Paid:</b> ${paidCount} &nbsp; <b>Pending:</b> ${pending} &nbsp; <b>Overdue:</b> ${overdue} &nbsp; <b>Total Paid:</b> ${moneyD(paidTotal)} &nbsp; <b>Remaining:</b> ${moneyD(balance)} &nbsp; <b>Penalty:</b> ${moneyD(penalty)} &nbsp; <b>Total Due:</b> ${moneyD(balance)}</p>`);
 }catch(e){console.error(e);alert('EMI list load failed: '+(e?.message||e));}
};
})();
