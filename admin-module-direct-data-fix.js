/* HELP FOR YOU — Direct Admin module data renderer */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
let sb;
function db(){return sb||(sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY))}
async function get(table,order){try{let q=db().from(table).select('*');if(order)q=q.order(order,{ascending:false});const r=await q;return r.error?[]:(r.data||[])}catch(e){console.warn('HFY module table',table,e);return[]}}
function customersMap(){return new Map((window.__HFY_CUSTOMERS||[]).map(x=>[String(x.id),x]))}
async function render(){
 try{
  const [customers,loans,apps,emis,pays,tx,staff]=await Promise.all([
   get('customers','created_at'),get('loan_accounts','created_at'),get('loan_applications','created_at'),get('loan_emi_schedule','due_date'),get('loan_repayments','payment_date'),get('financial_transactions','transaction_date'),get('staff','created_at')
  ]);
  window.__HFY_CUSTOMERS=customers;window.__HFY_LOANS=loans;window.__HFY_APPLICATIONS=apps;window.__HFY_EMIS=emis;window.__HFY_PAYMENTS=pays;window.__HFY_TRANSACTIONS=tx;window.__HFY_STAFF=staff;
  const cm=customersMap();
  const la=document.getElementById('loanAccountsBody');
  if(la)la.innerHTML='<div class="wrap"><table><thead><tr><th>Loan ID</th><th>Customer</th><th>Loan Amount</th><th>Total Repayment</th><th>Paid</th><th>Outstanding</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead><tbody>'+(loans.map(x=>'<tr><td>'+esc(x.loan_id)+'</td><td>'+esc(cm.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+money(x.loan_amount)+'</td><td>'+money(x.total_repayment)+'</td><td>'+money(x.total_paid)+'</td><td>'+money(x.remaining_amount)+'</td><td>'+esc(x.start_date||'-')+'</td><td>'+esc(x.end_date||'-')+'</td><td>'+esc(x.loan_status||'-')+'</td></tr>').join('')||'<tr><td colspan="9">No loan accounts found.</td></tr>')+'</tbody></table></div>';
  const ac=document.getElementById('accountingBody');
  if(ac)ac.innerHTML='<div class="wrap"><table><thead><tr><th>Transaction ID</th><th>Customer</th><th>Loan ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>'+(tx.map(x=>'<tr><td>'+esc(x.transaction_id||x.id)+'</td><td>'+esc(cm.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+esc(x.transaction_type||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.status||'-')+'</td><td>'+esc((x.transaction_date||'').slice(0,10))+'</td></tr>').join('')||'<tr><td colspan="7">No accounting transactions found.</td></tr>')+'</tbody></table></div>';
  const pay=document.getElementById('payments');
  if(pay&&pays.length) { const total=pays.reduce((n,x)=>n+Number(x.amount||0),0); pay.innerHTML='<h2>Payments</h2><p><b>Total Payments:</b> '+pays.length+' &nbsp; <b>Total Received:</b> '+money(total)+'</p><div class="wrap"><table><thead><tr><th>Customer</th><th>Loan ID</th><th>Amount</th><th>Date</th><th>Type</th><th>Status</th><th>Transaction</th></tr></thead><tbody>'+pays.map(x=>'<tr><td>'+esc(cm.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.payment_date||'-')+'</td><td>'+esc(x.payment_type||'-')+'</td><td>'+esc(x.status||'-')+'</td><td>'+esc(x.transaction_id||'-')+'</td></tr>').join('')+'</tbody></table></div>'; }
  const tr=document.getElementById('transactions');
  if(tr)tr.innerHTML='<h2>Transactions</h2><div class="wrap"><table><thead><tr><th>Transaction ID</th><th>Customer</th><th>Loan ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>'+(tx.map(x=>'<tr><td>'+esc(x.transaction_id||x.id)+'</td><td>'+esc(cm.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+esc(x.transaction_type||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.status||'-')+'</td><td>'+esc((x.transaction_date||'').slice(0,10))+'</td></tr>').join('')||'<tr><td colspan="7">No transactions found.</td></tr>')+'</tbody></table></div>';
  const st=document.getElementById('staff');
  if(st)st.innerHTML='<h2>Staff/Admin</h2><div class="wrap"><table><thead><tr><th>Employee ID</th><th>Name</th><th>Mobile</th><th>Role</th><th>Status</th></tr></thead><tbody>'+(staff.map(x=>'<tr><td>'+esc(x.employee_id||'-')+'</td><td>'+esc(x.name||'-')+'</td><td>'+esc(x.mobile||'-')+'</td><td>'+esc(x.role||'-')+'</td><td>'+esc(x.status||'-')+'</td></tr>').join('')||'<tr><td colspan="5">No staff records found.</td></tr>')+'</tbody></table></div>';
  const ov=document.getElementById('ovRows');
  if(ov)ov.innerHTML=(emis.filter(x=>x.status!=='paid'&&Number(x.remaining_amount||0)>0).map(x=>'<tr><td>'+esc(x.loan_id)+'</td><td>'+esc(cm.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+money(x.emi_amount)+'</td><td>'+esc(x.due_date||'-')+'</td><td>'+money(x.penalty)+'</td><td>'+money(x.remaining_amount)+'</td><td>—</td></tr>').join('')||'<tr><td colspan="7">No overdue EMI records found.</td></tr>');
  if(typeof window.renderPanel==='function'){['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].forEach(id=>{try{window.renderPanel(id)}catch(e){console.warn('module render',id,e)}})}
 }catch(e){console.error('HFY direct module render',e)}
}
function boot(){setTimeout(render,1200);setTimeout(render,3500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
