(()=>{
'use strict';
const escE=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyE=v=>'₹'+Number(v||0).toFixed(2);
const todayE=()=>new Date().toISOString().slice(0,10);
let emiRowsCache=[];
async function emiDB(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY)}
async function refreshEmiRepayment(){
 try{
  const s=await emiDB();
  const [lo,cu,em]=await Promise.all([
   s.from('loan_accounts').select('*').order('created_at',{ascending:false}),
   s.from('customers').select('*'),
   s.from('loan_emi_schedule').select('*').order('due_date',{ascending:true}).order('emi_number',{ascending:true})
  ]);
  if(lo.error)throw lo.error;if(cu.error)throw cu.error;if(em.error)throw em.error;
  const customers=cu.data||[], loans=lo.data||[], emis=em.data||[]; emiRowsCache=emis;
  const byCustomer=id=>customers.find(c=>String(c.id)===String(id));
  const groups=loans.map(l=>{
   const list=emis.filter(e=>String(e.loan_account_id)===String(l.id));
   const c=byCustomer(l.customer_id);
   const overdue=list.filter(e=>String(e.status).toLowerCase()!=='paid' && e.due_date<todayE());
   const penalty=Number(l.penalty_amount||0)+overdue.reduce((n,e)=>n+Number(e.penalty||0),0);
   const total=Number(l.total_repayment||0)+penalty;
   const remaining=list.reduce((n,e)=>n+Number(e.remaining_amount ?? Math.max(0,Number(e.emi_amount||0)+Number(e.penalty||0)-Number(e.paid_amount||0))),0);
   let status='pending';
   if(list.length && list.every(e=>String(e.status).toLowerCase()==='paid'))status='paid';
   else if(overdue.length)status='overdue';
   return {loan:l,c,list,penalty,total,remaining,status};
  });
  const body=document.getElementById('reRows'); if(!body)return;
  body.innerHTML=groups.map((g,i)=>`<tr><td>${escE(g.c?.full_name||'-')}</td><td>${escE(g.c?.mobile||'-')}</td><td>${escE(g.loan.loan_id||'-')}</td><td>${moneyE(g.loan.loan_amount)}</td><td>${moneyE(g.loan.total_repayment)}</td><td>${escE(g.loan.start_date||'-')}</td><td>${moneyE(g.penalty)}</td><td class="${g.status==='paid'?'paid':g.status==='overdue'?'over':'pending'}">${escE(g.status)}</td><td><button class="btn blue" onclick="viewFullEmi(${i})">View</button></td></tr>`).join('')||'<tr><td colspan="9">No loan EMI records.</td></tr>';
  window.__hfyEmiGroups=groups;
 }catch(e){console.error(e);alert('Admin data/action error: '+(e?.message||e))}
}
window.viewFullEmi=async i=>{
 const g=(window.__hfyEmiGroups||[])[i]; if(!g)return;
 const rows=g.list.map((e,j)=>{let st=String(e.status||'pending').toLowerCase();if(st!=='paid'&&Number(e.remaining_amount||0)>0&&e.due_date<todayE())st='overdue';const total=Number(e.emi_amount||0)+Number(e.penalty||0);const rem=Math.max(0,total-Number(e.paid_amount||0));return `<tr><td>${j+1}</td><td>${escE(e.due_date)}</td><td>${moneyE(e.emi_amount)}</td><td>${moneyE(e.penalty)}</td><td>${moneyE(total)}</td><td>${moneyE(e.paid_amount)}</td><td>${moneyE(rem)}</td><td class="${st==='paid'?'paid':st==='overdue'?'over':'pending'}">${escE(st)}</td><td><button class="btn green" onclick="emiActionPaid('${escE(e.id)}')">Paid</button></td></tr>`}).join('');
 const html=`<p><b>Name:</b> ${escE(g.c?.full_name||'-')} &nbsp; <b>Loan ID:</b> ${escE(g.loan.loan_id||'-')} &nbsp; <b>Mobile:</b> ${escE(g.c?.mobile||'-')}</p><p><b>Sanction Loan:</b> ${moneyE(g.loan.loan_amount)} &nbsp; <b>Total Loan:</b> ${moneyE(g.total)} &nbsp; <b>Sanction Date:</b> ${escE(g.loan.start_date||'-')}</p><div class="wrap"><table><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows||'<tr><td colspan="9">No EMI records.</td></tr>'}</tbody></table></div>`;
 document.getElementById('mt').textContent='Full EMI List';document.getElementById('mb').innerHTML=html;document.getElementById('modal').classList.add('on');
};
window.emiActionPaid=async id=>{
 try{const s=await emiDB();const q=await s.from('loan_emi_schedule').select('emi_amount,penalty,paid_amount').eq('id',id).single();if(q.error)throw q.error;const total=Number(q.data.emi_amount||0)+Number(q.data.penalty||0);const r=await s.from('loan_emi_schedule').update({paid_amount:total,remaining_amount:0,status:'paid',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await refreshEmiRepayment();const i=(window.__hfyEmiGroups||[]).findIndex(g=>g.list.some(e=>String(e.id)===String(id)));if(i>=0)window.viewFullEmi(i)}catch(e){console.error(e);alert('Admin data/action error: '+(e?.message||e))}
};
const oldShow=window.show;window.show=(id,b)=>{oldShow&&oldShow(id,b);if(id==='repay')setTimeout(refreshEmiRepayment,100)};
setTimeout(()=>{if(document.getElementById('repay'))refreshEmiRepayment()},500);
})();