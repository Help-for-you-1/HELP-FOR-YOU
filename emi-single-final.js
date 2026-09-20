/* HELP FOR YOU — SINGLE ADMIN EMI / REPAYMENT FLOW
   One renderer + one Pay Now handler. Admin overdue charge: 5% per overdue day (compounded).
*/
(()=>{'use strict';
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const today=()=>new Date().toISOString().slice(0,10);
const penalty=e=>{
 const due=String(e.due_date||'').slice(0,10),t=today();
 if(!due||due>=t||String(e.status||'').toLowerCase()==='paid')return Number(e.penalty||0);
 const days=Math.max(0,Math.floor((new Date(t+'T00:00:00')-new Date(due+'T00:00:00'))/86400000));
 return Number((Number(e.emi_amount||0)*(Math.pow(1.05,days)-1)).toFixed(2));
};
const stat=e=>{
 const p=penalty(e),td=Number(e.emi_amount||0)+p,pa=Number(e.paid_amount||0),r=Math.max(0,td-pa);
 if(r<=0||String(e.status||'').toLowerCase()==='paid')return 'paid';
 return String(e.due_date||'').slice(0,10)<today()?'overdue':'pending';
};
async function refreshList(){
 const s=db();
 const [lr,cr,er]=await Promise.all([
  s.from('loan_accounts').select('*').order('created_at',{ascending:false}),
  s.from('customers').select('id,full_name,mobile'),
  s.from('loan_emi_schedule').select('*').order('emi_number',{ascending:true})
 ]);
 if(lr.error)throw lr.error;if(cr.error)throw cr.error;if(er.error)throw er.error;
 const loans=lr.data||[],customers=cr.data||[],emis=er.data||[];
 window.__emiLoanRows=loans;
 const body=document.getElementById('reRows');if(!body)return;
 const active=loans.filter(l=>String(l.loan_status||'').toLowerCase()!=='completed'&&String(l.status||'').toLowerCase()!=='closed');
 body.innerHTML=active.map((l,i)=>{
  const c=customers.find(x=>String(x.id)===String(l.customer_id));
  const es=emis.filter(e=>String(e.loan_account_id||e.loan_id)===String(l.id||l.loan_id));
  let total=0,paid=0,overdue=0;
  es.forEach(e=>{const p=penalty(e),td=Number(e.emi_amount||0)+p,pa=Number(e.paid_amount||0);total+=td;paid+=pa;if(stat(e)==='overdue')overdue+=Math.max(0,td-pa);});
  const status=es.length&&es.every(e=>stat(e)==='paid')?'paid':overdue>0?'overdue':'pending';
  return '<tr><td>'+esc(c?.full_name||'-')+'</td><td>'+esc(l.loan_id||'-')+'</td><td>'+esc(c?.mobile||'-')+'</td><td>'+money(l.loan_amount)+'</td><td>'+money(total)+'</td><td>'+esc(l.start_date||'-')+'</td><td>'+money(overdue)+'</td><td class="'+(status==='paid'?'paid':status==='overdue'?'over':'pending')+'"><b>'+status+'</b></td><td><button class="btn blue" onclick="viewLoanEmi('+i+')">View</button></td></tr>';
 }).join('')||'<tr><td colspan="9">No active EMI / Repayment records.</td></tr>';
}
window.viewLoanEmi=async function(i){
 try{
  const loan=(window.__emiLoanRows||[])[i];if(!loan)return alert('Loan record not found.');
  const s=db(),q=await s.from('loan_emi_schedule').select('*').eq('loan_account_id',loan.id).order('emi_number',{ascending:true});
  if(q.error)throw q.error;
  const c=await s.from('customers').select('full_name,mobile').eq('id',loan.customer_id).maybeSingle();if(c.error)throw c.error;
  const es=q.data||[];let paid=0,rem=0,pen=0,pc=0,pending=0,over=0;
  const rows=es.map(e=>{const p=penalty(e),a=Number(e.emi_amount||0),td=a+p,pa=Number(e.paid_amount||0),r=Math.max(0,td-pa),st=stat(e);paid+=pa;rem+=r;pen+=p;if(st==='paid')pc++;else if(st==='overdue')over++;else pending++;
   const action=st==='paid'?'<button class="btn red" onclick="hfyMarkEmiUnpaid(\''+esc(e.id)+'\')">Mark Unpaid</button>':'<button class="btn '+(st==='overdue'?'red':'green')+'" onclick="hfyPay(\''+esc(e.id)+'\')">Pay Now</button>';
   return '<tr><td>'+esc(e.emi_number)+'</td><td>'+esc(String(e.due_date||'').slice(0,10))+'</td><td>'+money(a)+'</td><td>'+money(p)+'</td><td>'+money(td)+'</td><td>'+money(pa)+'</td><td>'+money(r)+'</td><td class="'+(st==='paid'?'paid':st==='overdue'?'over':'pending')+'"><b>'+st+'</b></td><td>'+action+' <button class="btn gray" onclick="hfyEditEmi(\''+esc(e.id)+'\')">Edit</button></td></tr>';
  }).join('');
  openBox('Full EMI List','<p><b>Name:</b> '+esc(c.data?.full_name||'-')+' &nbsp; <b>Loan ID:</b> '+esc(loan.loan_id||'-')+' &nbsp; <b>Mobile:</b> '+esc(c.data?.mobile||'-')+' &nbsp; <b>Sanction Loan:</b> '+money(loan.loan_amount)+' &nbsp; <b>Total Loan:</b> '+money(es.reduce((n,e)=>n+Number(e.emi_amount||0)+penalty(e),0))+' &nbsp; <b>Sanction Date:</b> '+esc(loan.start_date||'-')+'</p><div class="wrap"><table style="min-width:1200px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div><p><b>Total EMI:</b> '+es.length+' &nbsp; <b>Paid:</b> '+pc+' &nbsp; <b>Pending:</b> '+pending+' &nbsp; <b>Overdue:</b> '+over+' &nbsp; <b>Total Paid:</b> '+money(paid)+' &nbsp; <b>Remaining:</b> '+money(rem)+' &nbsp; <b>Penalty:</b> '+money(pen)+' &nbsp; <b>Total Due:</b> '+money(rem)+'</p>');
 }catch(e){console.error(e);alert('EMI list load failed: '+(e?.message||e));}
};
window.hfyPay=async function(id){
 try{
  const s=db(),q=await s.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();if(q.error)throw q.error;
  const e=q.data;if(!e)return alert('EMI record not found.');
  const p=penalty(e),remaining=Math.max(0,Number(e.emi_amount||0)+p-Number(e.paid_amount||0));if(remaining<=0)return alert('This EMI is already paid.');
  let customer='-';if(e.customer_id){const c=await s.from('customers').select('full_name').eq('id',e.customer_id).maybeSingle();if(c.error)throw c.error;customer=c.data?.full_name||'-';}
  window.__hfySinglePay={id:e.id,remaining};
  openBox('EMI Payment','<div class="form"><div class="full"><b>Customer:</b> '+esc(customer)+' &nbsp; <b>EMI No.:</b> '+esc(e.emi_number)+'</div><div class="full"><b>Current EMI Due:</b> '+money(remaining)+'</div><label class="full">Payment Amount<input id="hfySinglePayAmount" type="number" min="0.01" step="0.01" value="'+remaining.toFixed(2)+'"></label><label>Payment Method<select id="hfySinglePayMethod"><option value="Cash">Cash</option><option value="UPI">UPI</option></select></label><div class="full"><button class="btn green" onclick="hfySingleConfirmPay()">Confirm Payment</button></div></div>');
 }catch(e){console.error(e);alert('Payment screen error: '+(e?.message||e));}
};
window.hfySingleConfirmPay=async function(){
 const x=window.__hfySinglePay;if(!x)return alert('Payment screen expired.');
 const amount=Number(document.getElementById('hfySinglePayAmount')?.value||0),method=document.getElementById('hfySinglePayMethod')?.value==='UPI'?'UPI':'Cash';
 if(!Number.isFinite(amount)||amount<=0)return alert('Enter a valid payment amount.');
 if(!confirm('Confirm '+method+' payment of '+money(amount)+'?'))return;
 try{
  const s=db(),r=await s.rpc('hfy_admin_bulk_payment',{p_emi_id:x.id,p_amount:amount,p_payment_date:today(),p_payment_type:method,p_transaction_id:null,p_remarks:'Admin EMI payment - '+method});
  if(r.error)throw r.error;if(!r.data?.success)throw new Error(r.data?.message||'Payment was not completed.');
  if(typeof closeM==='function')closeM();await refreshList();if(typeof loadData==='function')await loadData();if(typeof loadEMI==='function')await loadEMI();if(typeof render==='function')await render();
  alert(method+' payment recorded successfully: '+money(amount)+(Number(r.data.unallocated_amount||0)>0?' | Unallocated: '+money(r.data.unallocated_amount):''));
 }catch(e){console.error(e);alert('Payment failed: '+(e?.message||e));}
};
window.hfyMarkEmiUnpaid=async function(id){
 if(!id)return alert('EMI not found.');if(!confirm('Are you sure you want to mark this EMI as Unpaid? Any recorded payment linked to this EMI will be reversed.'))return;
 try{const s=db(),r=await s.rpc('hfy_mark_emi_unpaid',{p_emi_id:id});if(r.error)throw r.error;if(!r.data?.success)throw new Error('Mark Unpaid was not completed.');if(typeof closeM==='function')closeM();await refreshList();alert('EMI marked as Unpaid successfully.');}catch(e){console.error(e);alert('Mark Unpaid error: '+(e?.message||e));}
};
window.emiFinalPaid=window.hfyPay;window.emi30Paid=window.hfyPay;window.paid=window.hfyPay;
const oldShow=window.show;window.show=(id,b)=>{if(oldShow)oldShow(id,b);if(id==='repay')setTimeout(refreshList,150);};
setTimeout(refreshList,800);
})();