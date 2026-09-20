/* HELP FOR YOU — Internal Credit / Repayment Report (CIBIL-style, not an official CIBIL report) */
(()=>{'use strict';
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const daysLate=d=>{if(!d)return 0;const a=new Date(String(d).slice(0,10)+'T00:00:00'),b=new Date(new Date().toISOString().slice(0,10)+'T00:00:00');return Math.max(0,Math.floor((b-a)/86400000));};
let cache={customers:[],loans:[],emis:[],payments:[]};

async function loadCreditReport(){
 try{
  const s=db();
  const [cr,lr,er,pr]=await Promise.all([
   s.from('customers').select('id,full_name,mobile'),
   s.from('loan_accounts').select('id,loan_id,customer_id,loan_amount,total_repayment,total_paid,remaining_amount,loan_status,start_date,end_date').order('created_at',{ascending:false}),
   s.from('loan_emi_schedule').select('id,loan_account_id,loan_id,customer_id,emi_number,due_date,emi_amount,penalty,paid_amount,remaining_amount,status').order('due_date'),
   s.from('loan_repayments').select('id,loan_id,customer_id,amount,payment_date,payment_type,status').order('payment_date',{ascending:false})
  ]);
  if(cr.error)throw cr.error;if(lr.error)throw lr.error;if(er.error)throw er.error;if(pr.error)throw pr.error;
  cache={customers:cr.data||[],loans:lr.data||[],emis:er.data||[],payments:pr.data||[]};
  renderCreditRows();
 }catch(e){console.error(e);const b=document.getElementById('creditRows');if(b)b.innerHTML='<tr><td colspan="10">Credit report could not be loaded.</td></tr>';}
}
function customerName(id){return cache.customers.find(c=>String(c.id)===String(id))?.full_name||'-';}
function customerMobile(id){return cache.customers.find(c=>String(c.id)===String(id))?.mobile||'-';}
function profile(c){
 const loans=cache.loans.filter(l=>String(l.customer_id)===String(c.id));
 const emis=cache.emis.filter(e=>String(e.customer_id)===String(c.id));
 const paid=emis.filter(e=>Number(e.remaining_amount||0)<=0||String(e.status||'').toLowerCase()==='paid');
 const overdue=emis.filter(e=>Number(e.remaining_amount||0)>0&&String(e.due_date||'')<new Date().toISOString().slice(0,10));
 const closed=loans.filter(l=>String(l.loan_status||'').toLowerCase()==='completed');
 const active=loans.filter(l=>String(l.loan_status||'').toLowerCase()!=='completed');
 const totalDue=emis.reduce((n,e)=>n+Number(e.emi_amount||0)+Number(e.penalty||0),0);
 const totalPaid=emis.reduce((n,e)=>n+Number(e.paid_amount||0),0);
 const onTime=paid.filter(e=>Number(e.paid_amount||0)>=Number(e.emi_amount||0)+Number(e.penalty||0)&&String(e.due_date||'')>=String((cache.payments.find(p=>String(p.loan_id)===String(e.loan_id)&&String(p.customer_id)===String(c.id))||{}).payment_date||e.due_date)).length;
 const today=new Date().toISOString().slice(0,10);
 const dueEmis=emis.filter(e=>String(e.due_date||'')<=today);
 const futureEmis=emis.filter(e=>String(e.due_date||'')>today);
 const duePaid=dueEmis.filter(e=>Number(e.remaining_amount||0)<=0||String(e.status||'').toLowerCase()==='paid');
 const currentOverdue=dueEmis.filter(e=>Number(e.remaining_amount||0)>0);
 const repaymentRate=dueEmis.length?Math.min(100,(duePaid.length/dueEmis.length)*100):100;
 const amountCompletion=dueEmis.reduce((n,e)=>n+Number(e.emi_amount||0)+Number(e.penalty||0),0);
 const dueAmountPaid=dueEmis.reduce((n,e)=>n+Math.min(Number(e.paid_amount||0),Number(e.emi_amount||0)+Number(e.penalty||0)),0);
 const amountRate=amountCompletion?Math.min(100,(dueAmountPaid/amountCompletion)*100):100;
 const repaymentRows=cache.payments.filter(x=>String(x.customer_id)===String(c.id)&&String(x.status||'').toLowerCase()!=='failed');
 const latePaymentRows=repaymentRows.filter(x=>Number(x.overdue_days||0)>0);
 const maxOverdueDays=Math.max(0,...repaymentRows.map(x=>Number(x.overdue_days||0)));
 const closedRate=loans.length?(closed.length/loans.length)*100:0;
 const score=Math.round(Math.max(300,Math.min(900,
   300+(repaymentRate*.45)+(amountRate*.15)+(closedRate*.10)+(currentOverdue.length===0?15:Math.max(0,15-currentOverdue.length*3))+
   (maxOverdueDays===0?15:maxOverdueDays<=1?10:maxOverdueDays<=3?5:0)
 )));
 const lateDays=latePaymentRows.reduce((n,e)=>n+Number(e.overdue_days||0),0);
 return {loans,emis,paid,overdue,closed,active,totalDue,totalPaid,onTime,lateDays,repaymentRate,lateRate,score,dueEmis,futureEmis,duePaid,currentOverdue,amountRate,maxOverdueDays,latePaymentRows,closedRate};
}
function badge(v,kind){return '<span class="creditBadge '+(kind||'')+'">'+esc(v)+'</span>';}
function renderCreditRows(){
 const b=document.getElementById('creditRows');if(!b)return;
 const term=(document.getElementById('creditSearch')?.value||'').toLowerCase();
 const rows=cache.customers.filter(c=>(String(c.full_name||'')+' '+String(c.mobile||'')).toLowerCase().includes(term));
 b.innerHTML=rows.map(c=>{const p=profile(c);const state=p.overdue.length?'Overdue':(p.closed.length?'Closed':'Active');return '<tr><td>'+esc(c.full_name)+'</td><td>'+esc(c.mobile||'-')+'</td><td>'+p.loans.length+'</td><td>'+p.closed.length+'</td><td>'+p.duePaid.length+'/'+p.dueEmis.length+'</td><td>'+p.currentOverdue.length+'</td><td>'+p.score+'</td><td>'+p.repaymentRate.toFixed(1)+'%</td><td>'+badge(state,state.toLowerCase())+'</td><td><button class="btn blue" onclick="viewCreditReport(\''+esc(c.id)+'\')">View Report</button></td></tr>';}).join('')||'<tr><td colspan="10">No customer records.</td></tr>';
}
window.viewCreditReport=async function(id){
 const c=cache.customers.find(x=>String(x.id)===String(id));if(!c)return;
 const p=profile(c);
 const loanRows=p.loans.map(l=>'<tr><td>'+esc(l.loan_id)+'</td><td>'+money(l.loan_amount)+'</td><td>'+money(l.total_repayment)+'</td><td>'+money(l.total_paid)+'</td><td>'+money(l.remaining_amount)+'</td><td>'+esc(l.loan_status||'-')+'</td><td>'+esc(l.end_date||'-')+'</td></tr>').join('');
 const emiRows=p.emis.map(e=>{const late=Number(e.remaining_amount||0)>0&&String(e.due_date||'')<new Date().toISOString().slice(0,10);return '<tr><td>'+esc(e.loan_id)+'</td><td>'+esc(e.emi_number)+'</td><td>'+esc(e.due_date)+'</td><td>'+money(e.emi_amount)+'</td><td>'+money(e.penalty)+'</td><td>'+money(e.paid_amount)+'</td><td>'+money(e.remaining_amount)+'</td><td>'+badge(late?'Overdue':(String(e.status||'').toLowerCase()==='paid'?'Paid':'Pending'),late?'over':'paid')+'</td></tr>';}).join('');
 const html='<div class="creditHead"><div><h3 style="margin:0">'+esc(c.full_name)+'</h3><div>'+esc(c.mobile||'-')+'</div></div><div class="creditScore"><small>HFY Repayment Score</small><b>'+p.score+'</b><span>Internal use only</span></div></div><p class="creditNotice">This is an internal repayment-behaviour report for HELP FOR YOU. It is <b>not an official CIBIL/TransUnion credit report</b> and does not replace a bureau enquiry.</p><div class="creditStats"><div><small>Total Loans</small><b>'+p.loans.length+'</b></div><div><small>Closed Loans</small><b>'+p.closed.length+'</b></div><div><small>Due EMIs Paid</small><b>'+p.duePaid.length+'/'+p.dueEmis.length+'</b></div><div><small>Current Overdue</small><b>'+p.currentOverdue.length+'</b></div><div><small>Repayment Rate</small><b>'+p.repaymentRate.toFixed(1)+'%</b></div><div><small>Max Overdue Days</small><b>'+p.maxOverdueDays+'</b></div><div><small>Outstanding</small><b>'+money(p.loans.reduce((n,l)=>n+Number(l.remaining_amount||0),0))+'</b></div><div><small>Total Paid</small><b>'+money(p.totalPaid)+'</b></div></div><h4>Loan History</h4><div class="wrap"><table><tr><th>Loan ID</th><th>Loan Amount</th><th>Total Loan</th><th>Total Paid</th><th>Outstanding</th><th>Status</th><th>End Date</th></tr>'+loanRows+'</table></div><h4>EMI Behaviour</h4><div class="wrap"><table><tr><th>Loan ID</th><th>EMI No</th><th>Due Date</th><th>EMI</th><th>Penalty</th><th>Paid</th><th>Remaining</th><th>Status</th></tr>'+emiRows+'</table></div><div class="creditActions"><button class="btn blue" onclick="window.printCreditReport(\''+esc(c.id)+'\')">Print Report</button><button class="btn green" onclick="closeM()">Close</button></div>';
 openBox('Customer Credit / Repayment Report',html);
};
window.printCreditReport=function(id){
 const c=cache.customers.find(x=>String(x.id)===String(id));if(!c)return;
 const p=profile(c);
 const w=window.open('','_blank');if(!w)return;
 w.document.write('<!doctype html><html><head><title>HELP FOR YOU | Credit Report</title><style>body{font:14px Arial;padding:28px;color:#172033}h1,h2{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{padding:8px;border:1px solid #ddd;text-align:left}.score{font-size:34px;font-weight:800;margin:15px 0}.note{padding:10px;background:#f3f6fa}</style></head><body><h1>HELP FOR YOU</h1><h2>Customer Credit / Repayment Report</h2><p><b>Customer:</b> '+esc(c.full_name)+' &nbsp; <b>Mobile:</b> '+esc(c.mobile||'-')+'</p><div class="score">HFY Repayment Score: '+p.score+'</div><div class="note">Internal repayment-behaviour report only. Not an official CIBIL/TransUnion report.</div><p>Total Loans: '+p.loans.length+' | Closed: '+p.closed.length+' | EMIs Paid: '+p.paid.length+'/'+p.emis.length+' | Overdue EMIs: '+p.overdue.length+' | Repayment Rate: '+p.repaymentRate.toFixed(1)+'% | Total Paid: '+money(p.totalPaid)+'</p><table><tr><th>Loan ID</th><th>Amount</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr>'+p.loans.map(l=>'<tr><td>'+esc(l.loan_id)+'</td><td>'+money(l.loan_amount)+'</td><td>'+money(l.total_repayment)+'</td><td>'+money(l.total_paid)+'</td><td>'+money(l.remaining_amount)+'</td><td>'+esc(l.loan_status||'-')+'</td></tr>').join('')+'</table><script>window.print();</script></body></html>');w.document.close();
};
window.loadCreditReport=loadCreditReport;
setTimeout(loadCreditReport,1100);
const oldShow=window.show;window.show=(id,b)=>{if(oldShow)oldShow(id,b);if(id==='dash')setTimeout(loadCreditReport,180);};
})();
