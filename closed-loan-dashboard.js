/* HELP FOR YOU — Dashboard Closed Loans section */
(()=>{'use strict';
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
async function loadClosedLoans(){
 try{
  const s=db();
  const [lr,cr]=await Promise.all([
   s.from('loan_accounts').select('id,loan_id,customer_id,loan_amount,total_repayment,total_paid,remaining_amount,penalty_amount,loan_status,start_date,end_date').eq('loan_status','completed').order('end_date',{ascending:false}),
   s.from('customers').select('id,full_name,mobile')
  ]);
  if(lr.error)throw lr.error;if(cr.error)throw cr.error;
  const rows=lr.data||[],customers=cr.data||[],body=document.getElementById('closedLoanRows');
  if(!body)return;
  body.innerHTML=rows.map(l=>{const c=customers.find(x=>String(x.id)===String(l.customer_id));return '<tr><td>'+esc(c?.full_name||'-')+'</td><td>'+esc(l.loan_id||'-')+'</td><td>'+esc(c?.mobile||'-')+'</td><td>'+money(l.loan_amount)+'</td><td>'+money(l.total_repayment)+'</td><td>'+money(l.total_paid)+'</td><td>'+esc(l.end_date||'-')+'</td><td><b class="paid">Closed</b></td></tr>';}).join('')||'<tr><td colspan="8">No closed loans.</td></tr>';
 }catch(e){console.error(e);const body=document.getElementById('closedLoanRows');if(body)body.innerHTML='<tr><td colspan="8">Closed loan list could not be loaded.</td></tr>';}
}
window.loadClosedLoans=loadClosedLoans;
setTimeout(loadClosedLoans,900);
/* Rebuild dashboard data after the final navigation script has bound on refresh. */
setTimeout(()=>{try{
 if(typeof window.renderCore==='function')window.renderCore();
 if(typeof window.loadClosedLoans==='function')window.loadClosedLoans();
 if(typeof window.loadCreditReport==='function')window.loadCreditReport();
}catch(e){console.error('HFY Dashboard restore error',e)}},1800);
const oldShow=window.show;window.show=(id,b)=>{if(oldShow)oldShow(id,b);if(id==='dash')setTimeout(()=>{if(typeof window.renderCore==='function')window.renderCore();loadClosedLoans();if(typeof window.loadCreditReport==='function')window.loadCreditReport()},150);};
})();
