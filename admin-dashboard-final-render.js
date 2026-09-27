/* HELP FOR YOU — Final Dashboard renderer */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
async function dashboard(){
 try{
  if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}
  const s=db();
  const [a,c,l,e,p]=await Promise.all([
   s.from('loan_applications').select('*').order('created_at',{ascending:false}),
   s.from('customers').select('*').order('created_at',{ascending:false}),
   s.from('loan_accounts').select('*').order('created_at',{ascending:false}),
   s.from('loan_emi_schedule').select('*').order('due_date'),
   s.from('loan_repayments').select('*').order('payment_date',{ascending:false})
  ]);
  if(a.error)throw a.error;if(c.error)throw c.error;if(l.error)throw l.error;if(e.error)throw e.error;if(p.error)throw p.error;
  const apps=a.data||[],customers=c.data||[],loans=l.data||[],emis=e.data||[],payments=p.data||[];
  const pending=new Set(['draft','submitted','pending','under_review']);
  const activeLoans=loans.filter(x=>!['completed','closed'].includes(String(x.loan_status||'').toLowerCase()));
  const due=activeLoans.reduce((n,x)=>n+Math.max(0,Number(x.remaining_amount||0))+Math.max(0,Number(x.penalty_amount||0)),0);
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('nA',apps.length);set('nP',apps.filter(x=>pending.has(String(x.status||'').toLowerCase())).length);set('nC',customers.length);set('nL',loans.filter(x=>['active','approved','running'].includes(String(x.loan_status||'').toLowerCase())).length);set('nD',money(due));
  const profiles=customers.map(c=>{const ls=loans.filter(x=>String(x.customer_id)===String(c.id));const es=emis.filter(x=>String(x.customer_id)===String(c.id));const paid=es.filter(x=>String(x.status||'').toLowerCase()==='paid'||Number(x.remaining_amount||0)<=0);const overdue=es.filter(x=>Number(x.remaining_amount||0)>0&&String(x.due_date||'')<new Date().toISOString().slice(0,10));const closed=ls.filter(x=>['completed','closed'].includes(String(x.loan_status||'').toLowerCase()));const dueEs=es.filter(x=>String(x.due_date||'')<=new Date().toISOString().slice(0,10));const duePaid=dueEs.filter(x=>String(x.status||'').toLowerCase()==='paid'||Number(x.remaining_amount||0)<=0);const rate=dueEs.length?Math.min(100,duePaid.length/dueEs.length*100):100;const score=Math.round(Math.max(300,Math.min(900,300+rate*0.45+(closed.length?20:0)+(overdue.length?0:30))));return{c,ls,es,paid,overdue,closed,rate,score}});
  const report=profiles.map(x=>'<tr><td>'+esc(x.c.full_name)+'</td><td>'+esc(x.c.mobile||'-')+'</td><td>'+x.ls.length+'</td><td>'+x.closed.length+'</td><td>'+x.paid.length+'/'+x.es.length+'</td><td>'+x.overdue.length+'</td><td>'+x.score+'</td><td>'+x.rate.toFixed(1)+'%</td><td><b class="'+(x.overdue.length?'over':'paid')+'">'+(x.overdue.length?'Overdue':(x.closed.length?'Closed':'Active'))+'</b></td><td><button class="btn blue" onclick="viewCreditReport(\''+esc(x.c.id)+'\')">View Report</button></td></tr>').join('')||'<tr><td colspan="10">No customer records.</td></tr>';
  const closedRows=loans.filter(x=>['completed','closed'].includes(String(x.loan_status||'').toLowerCase())).map(x=>{const c=customers.find(z=>String(z.id)===String(x.customer_id));return '<tr><td>'+esc(c?.full_name||'-')+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+esc(c?.mobile||'-')+'</td><td>'+money(x.loan_amount)+'</td><td>'+money(x.total_repayment)+'</td><td>'+money(x.total_paid)+'</td><td>'+esc(x.end_date||'-')+'</td><td><b class="paid">Closed</b></td></tr>'}).join('')||'<tr><td colspan="8">No closed loans.</td></tr>';
  const d=document.getElementById('dash');if(!d)return;
  d.innerHTML='<h2>Dashboard</h2><h3>Loan Plan</h3><div class="wrap"><table><tr><th>Amount</th><th>Tenure</th><th>Interest</th><th>Overdue</th></tr><tr><td>₹1,000–₹5,000</td><td>1 Month</td><td>20% / month</td><td>2% per overdue day</td></tr><tr><td>₹5,001–₹10,000</td><td>2 Months</td><td>20% / month</td><td>2% per overdue day</td></tr><tr><td>₹10,001–₹20,000</td><td>3 Months</td><td>20% / month</td><td>2% per overdue day</td></tr></table></div><h3>Customer Credit / Repayment Report</h3><p>Internal repayment behaviour summary to support customer re-loan review. This is not an official CIBIL report.</p><div class="actions"><input id="creditSearchDash" class="search" placeholder="Search customer name or mobile" oninput="filterDashCredit()"></div><div class="wrap"><table><thead><tr><th>Customer</th><th>Mobile</th><th>Total Loans</th><th>Closed</th><th>EMIs Paid</th><th>Overdue</th><th>HFY Score</th><th>Repayment Rate</th><th>Status</th><th>Report</th></tr></thead><tbody id="dashCreditRows">'+report+'</tbody></table></div><h3>Closed Loans</h3><div class="wrap"><table><thead><tr><th>Customer</th><th>Loan ID</th><th>Mobile</th><th>Loan Amount</th><th>Total Loan</th><th>Total Paid</th><th>Closed Date</th><th>Status</th></tr></thead><tbody id="dashClosedRows">'+closedRows+'</tbody></table></div>';
  window.filterDashCredit=()=>{const q=(document.getElementById('creditSearchDash')?.value||'').toLowerCase();document.querySelectorAll('#dashCreditRows tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')};
 }catch(err){console.error('Dashboard render failed:',err)}
}
window.renderFinalDashboard=dashboard;
setTimeout(dashboard,1800);setTimeout(dashboard,3500);
const oldShow=window.show;window.show=(id,b)=>{if(oldShow)oldShow(id,b);if(id==='dash')setTimeout(dashboard,150)};
})();
