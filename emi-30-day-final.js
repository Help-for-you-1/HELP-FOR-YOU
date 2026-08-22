(()=>{
'use strict';
const db30=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const esc30=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money30=v=>'₹'+Number(v||0).toFixed(2);
const day30=()=>new Date().toISOString().slice(0,10);
const add30=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
async function ensure30(loan){
  const sb=db30();
  const q=await sb.from('loan_emi_schedule').select('*').eq('loan_account_id',loan.id).order('emi_number',{ascending:true});
  if(q.error)throw q.error;
  let rows=q.data||[];
  const needed=Math.max(1,Number(loan.tenure_months||1)*30);
  if(rows.length>=needed)return rows;
  const start=String(loan.start_date||day30()).slice(0,10);
  const total=Number(loan.total_repayment||0);
  const amount=Number(loan.daily_emi||0)>0?Number(loan.daily_emi):total/needed;
  const existing=new Set(rows.map(x=>Number(x.emi_number)));
  const add=[];
  for(let n=1;n<=needed;n++)if(!existing.has(n))add.push({loan_account_id:loan.id,loan_id:loan.loan_id,customer_id:loan.customer_id,emi_number:n,due_date:add30(start,n),emi_amount:amount,penalty:0,total_due:amount,paid_amount:0,remaining_amount:amount,status:'upcoming'});
  if(add.length){const ins=await sb.from('loan_emi_schedule').insert(add);if(ins.error)throw ins.error;}
  const r=await sb.from('loan_emi_schedule').select('*').eq('loan_account_id',loan.id).order('emi_number',{ascending:true});
  if(r.error)throw r.error;return r.data||[];
}
function status30(e){if(String(e.status||'').toLowerCase()==='paid'||Number(e.remaining_amount||0)<=0)return 'paid';return String(e.due_date||'').slice(0,10)<day30()?'overdue':'pending';}
async function view30(i){
 try{
  const sb=db30();const base=await sb.from('loan_emi_schedule').select('*').order('due_date',{ascending:true});if(base.error)throw base.error;const row=(base.data||[])[i];if(!row)return alert('EMI record not found.');
  const loanQ=await sb.from('loan_accounts').select('*').eq('loan_id',row.loan_id).maybeSingle();if(loanQ.error)throw loanQ.error;if(!loanQ.data)return alert('Loan not found.');
  const es=await ensure30(loanQ.data);const c=await sb.from('customers').select('full_name,mobile').eq('id',row.customer_id).maybeSingle();if(c.error)throw c.error;
  let paid=0,rem=0,pen=0,pc=0,pending=0,over=0,total=0;
  const html=es.map(e=>{const s=status30(e),a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),td=a+p,rr=Math.max(0,td-pa);total+=td;paid+=pa;rem+=rr;pen+=p;if(s==='paid')pc++;else if(s==='overdue')over++;else pending++;const action=s==='paid'?'<button class="btn green" disabled>Paid</button>':s==='overdue'?'<button class="btn red" disabled>Overdue</button><button class="btn green" onclick="emi30Paid(\''+esc30(e.id)+'\')">Paid</button>':'<button class="btn gray" disabled>Pending</button><button class="btn green" onclick="emi30Paid(\''+esc30(e.id)+'\')">Paid</button>';return '<tr><td>'+esc30(e.emi_number)+'</td><td>'+esc30(String(e.due_date||'').slice(0,10))+'</td><td>'+money30(a)+'</td><td>'+money30(p)+'</td><td>'+money30(td)+'</td><td>'+money30(pa)+'</td><td>'+money30(rr)+'</td><td><button class="btn '+(s==='paid'?'green':s==='overdue'?'red':'gray')+'" disabled>'+esc30(s[0].toUpperCase()+s.slice(1))+'</button></td><td>'+action+'</td></tr>';}).join('');
  window.openBox('EMI / Repayment — Full EMI List','<p><b>Customer:</b> '+esc30(c.data?.full_name||'-')+' &nbsp; <b>Mobile:</b> '+esc30(c.data?.mobile||'-')+' &nbsp; <b>Loan ID:</b> '+esc30(row.loan_id)+'</p><div class="wrap"><table style="min-width:1200px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>'+html+'</tbody></table></div><p><b>Total EMI:</b> '+es.length+' &nbsp; <b>Paid:</b> '+pc+' &nbsp; <b>Pending:</b> '+pending+' &nbsp; <b>Overdue:</b> '+over+' &nbsp; <b>Total Paid:</b> '+money30(paid)+' &nbsp; <b>Remaining:</b> '+money30(rem)+' &nbsp; <b>Penalty:</b> '+money30(pen)+' &nbsp; <b>Total Due:</b> '+money30(total)+'</p>');
 }catch(e){console.error(e);alert('EMI list load failed: '+(e?.message||e));}
}
window.emi30Paid=async id=>{try{const sb=db30();const q=await sb.from('loan_emi_schedule').select('*').eq('id',id).single();if(q.error)throw q.error;const e=q.data,td=Number(e.emi_amount||0)+Number(e.penalty||0);const u=await sb.from('loan_emi_schedule').update({total_due:td,paid_amount:td,remaining_amount:0,status:'paid'}).eq('id',id);if(u.error)throw u.error;if(window.closeM)window.closeM();if(window.loadData)await window.loadData();alert('EMI marked as Paid successfully.');}catch(e){alert('EMI Payment error: '+(e?.message||e));}};
window.viewEmi=view30;
async function repairAll(){try{const sb=db30();const q=await sb.from('loan_accounts').select('*');if(q.error)throw q.error;for(const loan of q.data||[])await ensure30(loan);}catch(e){console.error('EMI schedule repair:',e);}}
repairAll();
})();
