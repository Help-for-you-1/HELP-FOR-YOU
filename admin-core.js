(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
let supa;
const D={a:[],c:[],l:[],e:[],p:[],t:[],s:[],w:[]};
function db(){if(!supa)supa=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);return supa}
function fail(e){console.error(e);alert('Admin data/action error: '+(e?.message||e))}
window.show=(id,b)=>{document.querySelectorAll('.panel').forEach(x=>x.classList.remove('on'));const p=$(id);if(p)p.classList.add('on');document.querySelectorAll('.m').forEach(x=>x.classList.remove('on'));if(b)b.classList.add('on');render()};
window.openBox=(t,h)=>{$('mt').textContent=t;$('mb').innerHTML=h;$('modal').classList.add('on')};
window.closeM=()=>{$('modal').classList.remove('on')};
const customerName=id=>{const c=D.c.find(x=>String(x.id)===String(id));return c?.full_name||'-'};
const isPending=x=>['draft','submitted','pending','under_review'].includes(String(x.status||'').toLowerCase());
async function loadData(){
 try{
  if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}
  const qs=[
   db().from('loan_applications').select('*').order('created_at',{ascending:false}),
   db().from('customers').select('*').order('created_at',{ascending:false}),
   db().from('loan_accounts').select('*').order('created_at',{ascending:false}),
   db().from('loan_emi_schedule').select('*').order('due_date'),
   db().from('loan_repayments').select('*').order('payment_date',{ascending:false}),
   db().from('financial_transactions').select('*').order('transaction_date',{ascending:false}),
   db().from('staff').select('*').order('created_at',{ascending:false}),
   db().from('staff_wallets').select('*')
  ];
  const r=await Promise.all(qs.map(p=>Promise.resolve(p).catch(error=>({data:[],error}))));
  D.a=r[0].error?(console.error('Applications load:',r[0].error),[]):(r[0].data||[]);
  D.c=r[1].error?(console.error('Customers load:',r[1].error),[]):(r[1].data||[]);
  D.l=r[2].error?(console.error('Loans load:',r[2].error),[]):(r[2].data||[]);
  D.e=r[3].error?(console.error('EMI load:',r[3].error),[]):(r[3].data||[]);
  D.p=r[4].error?(console.error('Repayments load:',r[4].error),[]):(r[4].data||[]);
  D.t=r[5].error?(console.error('Transactions load:',r[5].error),[]):(r[5].data||[]);
  D.s=r[6].error?(console.error('Staff load:',r[6].error),[]):(r[6].data||[]);
  D.w=r[7].error?(console.error('Wallet load:',r[7].error),[]):(r[7].data||[]);
  window.__HFY_APPLICATIONS=D.a;window.__HFY_CUSTOMERS=D.c;window.__HFY_LOANS=D.l;window.__HFY_EMIS=D.e;window.__HFY_PAYMENTS=D.p;window.__HFY_TRANSACTIONS=D.t;window.__HFY_STAFF=D.s;window.__HFY_WALLETS=D.w;
  render();
 }catch(e){fail(e)}
}
window.loadData=loadData;
function render(){
$('nA').textContent=D.a.length;$('nP').textContent=D.a.filter(isPending).length;$('nC').textContent=D.c.length;$('nL').textContent=D.l.length;const due=D.l.reduce((n,x)=>n+Number(x.remaining_amount||0),0);$('nD').textContent=money(due);const reportDue=$('reportDue');if(reportDue)reportDue.textContent=money(due);
$('appsRows').innerHTML=D.a.map((x,i)=>'<tr><td>'+esc(x.id??'-')+'</td><td>'+esc(x.full_name||'-')+'</td><td>'+esc(x.mobile||'-')+'</td><td>'+esc((x.applied_at||x.created_at||'').slice(0,10))+'</td><td>'+money(x.requested_amount||0)+'</td><td>'+esc(x.status||'-')+'</td><td><button class="btn gray" onclick="viewApp('+i+')">View</button></td></tr>').join('')||'<tr><td colspan="7">No applications.</td></tr>';
$('apRows').innerHTML=D.a.filter(x=>String(x.status||'').toLowerCase()!=='approved').map(x=>{const i=D.a.indexOf(x);const s=String(x.status||'pending');const cls=s.toLowerCase()==='rejected'?'over':'pending';return `<tr><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc((x.applied_at||x.created_at||'').slice(0,10))}</td><td>${money(x.requested_amount)}</td><td>${money(x.approved_amount||0)}</td><td class="${cls}">${esc(s)}</td><td><button class="btn blue" onclick="editApproval(${i})">Edit</button></td></tr>`}).join('')||'<tr><td colspan="7">No applications available for approval.</td></tr>';
const term=(($('search')||{}).value||'').toLowerCase();$('cuRows').innerHTML=D.c.filter(x=>(x.full_name+' '+x.mobile).toLowerCase().includes(term)).map((x,i)=>{const l=D.l.find(z=>String(z.customer_id)===String(x.id));return `<tr><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc(l?.loan_id||'-')}</td><td>${money(l?.loan_amount||0)}</td><td>${esc(l?.start_date||'-')}</td><td><button class="btn blue" onclick="editCustomer(${i})">View / Edit</button><button class="btn red" onclick="deleteCustomer(${i})">Delete</button></td></tr>`}).join('')||'<tr><td colspan="6">No customers.</td></tr>';
$('reRows').innerHTML=D.e.map((x,i)=>{let st=x.status;if(st!=='paid'&&Number(x.remaining_amount||0)>0&&x.due_date<today())st='overdue';return `<tr><td>${esc(customerName(x.customer_id))}</td><td>${esc(D.c.find(c=>String(c.id)===String(x.customer_id))?.mobile||'')}</td><td>${esc(x.loan_id)}</td><td>${money(x.emi_amount)}</td><td>${esc(x.due_date)}</td><td>${money(x.penalty)}</td><td>${money(Number(x.emi_amount||0)+Number(x.penalty||0))}</td><td>${money(x.paid_amount)}</td><td>${money(x.remaining_amount)}</td><td>${esc(st)}</td><td><button class="btn blue" onclick="viewEmi(${i})">View</button></td></tr>`}).join('')||'<tr><td colspan="11">No EMI records.</td></tr>';
renderPayments();renderTransactions();renderOverdue();renderStaff();
}
function paymentPenalty(e,dt){const due=String(e.due_date||'').slice(0,10),t=String(dt||today()).slice(0,10);if(!due||due>=t||String(e.status||'').toLowerCase()==='paid')return Number(e.penalty||0);const days=Math.max(0,Math.floor((new Date(t+'T00:00:00')-new Date(due+'T00:00:00'))/86400000));return Number((Number(e.emi_amount||0)*(Math.pow(1.05,days)-1)).toFixed(2))}
function paymentLoanRows(loanId){return D.e.filter(e=>String(e.loan_account_id)===String(loanId)&&String(e.status||'').toLowerCase()!=='paid'&&Number(e.remaining_amount||0)>0).sort((a,b)=>String(a.due_date).localeCompare(String(b.due_date)))}
function paymentCustomerMatch(q){q=String(q||'').toLowerCase().trim();if(!q)return null;return D.c.find(c=>String(c.id)===q||String(c.full_name||'').toLowerCase().includes(q)||String(c.mobile||'').toLowerCase().includes(q))||null}
function renderPayments(){
 $('payments').innerHTML='<h2>Payments</h2><div class="card"><h3 style="margin-top:0">Payment Form</h3><div class="form"><label class="full">Search Customer — Loan ID / Name / Mobile<input id="paymentLookup" class="search" placeholder="Enter Loan ID, customer name or mobile number" oninput="paymentLookupChanged()"></label><label>Customer Name<input id="payCustomerName" readonly placeholder="-"></label><label>Mobile Number<input id="payCustomerMobile" readonly placeholder="-"></label><label>Loan ID<select id="payLoan" onchange="renderPaymentEmis()"><option value="">Select Loan</option></select></label><label>Payment Date<input id="payDate" type="date" value="${today()}" onchange="renderPaymentEmis()"></label><label>Payment Method<select id="payMethod"><option value="Cash">Cash</option><option value="UPI">UPI</option></select></label><label class="full">Add Amount<input id="payAmount" type="number" min="0.01" step="0.01" placeholder="Enter amount to pay"></label><div class="full"><div id="paymentEmiDetails"></div></div><div class="full"><button class="btn green" onclick="payNowFromPaymentForm()">Pay Now</button></div></div></div><div id="paymentCustomerList"></div>';
 renderPaymentCustomerList();
}
function renderPaymentCustomerList(){
 const rows=D.c.map(x=>{const ps=D.p.filter(p=>String(p.customer_id)===String(x.id));const total=ps.reduce((n,p)=>n+Number(p.amount||0),0);const loans=[...new Set(D.l.filter(l=>String(l.customer_id)===String(x.id)&&!['closed','completed'].includes(String(l.loan_status||'').toLowerCase())).map(l=>l.loan_id).filter(Boolean))];return '<tr><td>'+esc(x.full_name||'-')+'</td><td>'+esc(x.mobile||'-')+'</td><td>'+esc(loans.join(', ')||'-')+'</td><td>'+money(total)+'</td></tr>'}).join('')||'<tr><td colspan="4">No customers found.</td></tr>';
 $('paymentCustomerList').innerHTML='<div class="wrap"><table><thead><tr><th>Customer</th><th>Mobile</th><th>Active Loan ID(s)</th><th>Total Paid</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
window.paymentLookupChanged=()=>{
 const c=paymentCustomerMatch($('paymentLookup')?.value||''),cn=$('payCustomerName'),cm=$('payCustomerMobile'),ls=$('payLoan');
 if(!c){if(cn)cn.value='';if(cm)cm.value='';if(ls)ls.innerHTML='<option value="">Select Loan</option>';const d=$('paymentEmiDetails');if(d)d.innerHTML='<p>Enter Loan ID, customer name or mobile number to load EMI details.</p>';return}
 if(cn)cn.value=c.full_name||'';if(cm)cm.value=c.mobile||'';
 const loans=D.l.filter(l=>String(l.customer_id)===String(c.id)&&!['closed','completed'].includes(String(l.loan_status||'').toLowerCase()));
 if(ls)ls.innerHTML='<option value="">Select Loan</option>'+loans.map(l=>'<option value="'+esc(l.id)+'">'+esc(l.loan_id)+' — Outstanding '+money(l.remaining_amount)+'</option>').join('');
 if(loans.length===1){ls.value=String(loans[0].id);renderPaymentEmis()}else{const d=$('paymentEmiDetails');if(d)d.innerHTML=loans.length?'Select the Loan ID to view EMI details.':'No active loan found for this customer.'}
};
window.renderPaymentEmis=()=>{
 const ls=$('payLoan'),d=$('paymentEmiDetails');if(!ls||!d)return;const loan=D.l.find(l=>String(l.id)===String(ls.value));if(!loan){d.innerHTML='<p>Select an active Loan ID to view EMI details.</p>';return}
 const dt=$('payDate')?.value||today(),rows=paymentLoanRows(loan.id);let total=0;
 const html=rows.map(e=>{const od=paymentPenalty(e,dt),due=Number(e.emi_amount||0)+od,paid=Number(e.paid_amount||0),rem=Math.max(0,due-paid);total+=rem;const st=String(e.due_date||'')<dt?'Overdue':'Pending';return '<tr><td>'+esc(e.emi_number)+'</td><td>'+esc(e.due_date)+'</td><td>'+money(e.emi_amount)+'</td><td>'+money(od)+'</td><td><b>'+money(due)+'</b></td><td>'+money(paid)+'</td><td>'+money(rem)+'</td><td>'+st+'</td></tr>'}).join('');
 d.innerHTML='<div class="card"><b>'+esc(customerName(loan.customer_id))+'</b> &nbsp; Loan ID: <b>'+esc(loan.loan_id)+'</b><br>EMI + Overdue Total Due: <b>'+money(total)+'</b></div><div class="wrap"><table><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI</th><th>Overdue</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th></tr></thead><tbody>'+(html||'<tr><td colspan="8">No unpaid EMI available.</td></tr>')+'</tbody></table></div>';
};
window.payNowFromPaymentForm=async()=>{
 try{
  const ls=$('payLoan'),loan=D.l.find(l=>String(l.id)===String(ls?.value));if(!loan)return alert('Select Loan ID.');
  const amount=Number($('payAmount')?.value||0);if(amount<=0)return alert('Enter payment amount.');
  const rows=paymentLoanRows(loan.id);if(!rows.length)return alert('No unpaid EMI available.');
  const total=rows.reduce((n,e)=>n+Math.max(0,Number(e.emi_amount||0)+paymentPenalty(e,$('payDate')?.value||today())-Number(e.paid_amount||0)),0);
  if(amount>total+0.01)return alert('Payment amount cannot exceed total EMI + overdue amount '+money(total)+'.');
  const first=rows[0],tx='TXN-'+Date.now(),method=$('payMethod')?.value||'Cash',date=$('payDate')?.value||today();
  const r=await db().rpc('hfy_admin_bulk_payment',{p_emi_id:first.id,p_amount:amount,p_payment_date:date,p_payment_type:method,p_transaction_id:tx,p_remarks:'Admin payment'});if(r.error)throw r.error;
  const allocated=Number(r.data?.allocated_amount||amount);
  const tr=await db().from('financial_transactions').insert({transaction_id:tx,customer_id:loan.customer_id,loan_account_id:loan.id,loan_id:loan.loan_id,amount:allocated,transaction_type:'EMI_PAYMENT',payment_method:method,status:'successful',notes:'Admin payment'});if(tr.error)console.error('Transaction record error:',tr.error);
  await loadData();alert('Payment successful. EMI paid: '+money(allocated));
 }catch(e){fail(e)}
};
window.paymentCustomer=id=>{const c=D.c.find(x=>String(x.id)===String(id));if(!c)return alert('Customer not found.');const l=D.l.find(x=>String(x.customer_id)===String(id)&&!['closed','completed'].includes(String(x.loan_status||'').toLowerCase()));if(!l)return alert('No active loan found.');$('paymentLookup').value=c.full_name||'';paymentLookupChanged();if($('payLoan')){$('payLoan').value=String(l.id);renderPaymentEmis()}};
window.addPayment=()=>{renderPayments();};

function renderTransactions(){$('transactions').innerHTML='<h2>Transactions</h2><div class="wrap"><table><tr><th>Transaction ID</th><th>Customer</th><th>Loan ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>'+(D.t.map(x=>`<tr><td>${esc(x.transaction_id)}</td><td>${esc(customerName(x.customer_id))}</td><td>${esc(x.loan_id)}</td><td>${esc(x.transaction_type)}</td><td>${money(x.amount)}</td><td>${esc(x.status)}</td><td>${esc((x.transaction_date||'').slice(0,10))}</td></tr>`).join('')||'<tr><td colspan="7">No transactions.</td></tr>')+'</table></div>'}
function overduePenalty(x,dt){const due=String(x.due_date||'').slice(0,10),t=String(dt||today()).slice(0,10);if(!due||due>=t||String(x.status||'').toLowerCase()==='paid')return Number(x.penalty||0);const days=Math.max(0,Math.floor((new Date(t+'T00:00:00')-new Date(due+'T00:00:00'))/86400000));return Number((Number(x.emi_amount||0)*(Math.pow(1.05,days)-1)).toFixed(2))}
function renderOverdue(){const dt=today();$('ovRows').innerHTML=D.e.filter(x=>String(x.status||'').toLowerCase()!=='paid'&&Number(x.remaining_amount||0)>0&&String(x.due_date||'')<dt).map(x=>{const days=Math.max(0,Math.floor((new Date(dt+'T00:00:00')-new Date(String(x.due_date).slice(0,10)+'T00:00:00'))/86400000));const penalty=overduePenalty(x,dt),total=Math.max(0,Number(x.emi_amount||0)+penalty),remaining=Math.max(0,total-Number(x.paid_amount||0));return '<tr><td>'+esc(x.loan_id)+'</td><td>'+esc(customerName(x.customer_id))+'</td><td>'+money(x.emi_amount)+'</td><td>'+days+'</td><td>'+money(penalty)+'</td><td>'+money(total)+'</td><td>'+money(x.paid_amount)+'</td><td>'+money(remaining)+'</td><td><button class="btn blue" onclick="viewOverdue(\''+x.id+'\')">View</button> <button class="btn green" onclick="payOverdue(\''+x.id+'\')">Pay Now</button></td></tr>'}).join('')||'<tr><td colspan="9">No overdue EMI.</td></tr>'}
window.viewOverdue=id=>{const x=D.e.find(e=>String(e.id)===String(id));if(!x)return alert('Overdue EMI not found.');const p=overduePenalty(x,today()),t=Number(x.emi_amount||0)+p,r=Math.max(0,t-Number(x.paid_amount||0));openBox('Overdue EMI Details','<p>Customer: <b>'+esc(customerName(x.customer_id))+'</b></p><p>Loan ID: <b>'+esc(x.loan_id)+'</b></p><p>EMI No: <b>'+esc(x.emi_number)+'</b></p><p>Due Date: <b>'+esc(x.due_date)+'</b></p><p>EMI: <b>'+money(x.emi_amount)+'</b></p><p>Overdue: <b>'+money(p)+'</b></p><p>Total Due: <b>'+money(t)+'</b></p><p>Paid: <b>'+money(x.paid_amount)+'</b></p><p>Remaining: <b>'+money(r)+'</b></p><button class="btn green" onclick="payOverdue(\''+x.id+'\')">Pay Now</button>')};
window.payOverdue=async id=>{try{const x=D.e.find(e=>String(e.id)===String(id));if(!x)return alert('Overdue EMI not found.');const amount=Math.max(0,Number(x.emi_amount||0)+overduePenalty(x,today())-Number(x.paid_amount||0));if(amount<=0)return alert('Overdue EMI already paid.');const tx='TXN-'+Date.now();const r=await db().rpc('hfy_admin_bulk_payment',{p_emi_id:x.id,p_amount:amount,p_payment_date:today(),p_payment_type:'Cash',p_transaction_id:tx,p_remarks:'Overdue EMI payment'});if(r.error)throw r.error;closeM();await loadData();alert('Overdue EMI paid successfully.')}catch(e){fail(e)}};
function renderStaff(){const walletMap=new Map(D.w.map(x=>[String(x.staff_id),Number(x.balance||0)]));$('staff').innerHTML='<h2>Staff/Admin</h2><button class="btn blue" onclick="addStaff()">+ Add Staff</button><div class="wrap"><table><tr><th>Employee ID</th><th>Name</th><th>Mobile</th><th>Role</th><th>Status</th><th>Payment</th><th>Loan Apply</th><th>ID</th><th>Wallet</th><th>Manage</th></tr>'+(D.s.map((x,i)=>`<tr><td>${esc(x.employee_id)}</td><td>${esc(x.name)}</td><td>${esc(x.mobile||'')}</td><td>${esc(x.role)}</td><td>${esc(x.status)}</td><td>${x.payment_enabled!==false?'🟢':'🔴'}</td><td>${x.loan_apply_enabled!==false?'🟢':'🔴'}</td><td>${x.login_enabled!==false?'🟢':'🔴'}</td><td><b>${money(walletMap.get(String(x.id))||0)}</b></td><td><button class="btn blue" onclick="manageStaff(${i})">Manage</button><button class="btn green" onclick="staffWallet(${i})">Wallet</button></td></tr>`).join('')||'<tr><td colspan="10">No staff.</td></tr>')+'</table></div>'}
window.manageStaff=async i=>{const x=D.s[i];if(!x)return;openBox('Manage Staff',`<div class="form"><label>Employee ID<input value="${esc(x.employee_id)}" readonly></label><label>Name<input id="msn" value="${esc(x.name)}"></label><label>Mobile<input id="msm" value="${esc(x.mobile||'')}"></label><label>Email<input id="mse" value="${esc(x.email||'')}"></label><label>Role<select id="msr"><option value="verifier">verifier</option><option value="loan_officer">loan_officer</option><option value="collection_officer">collection_officer</option><option value="manager">manager</option><option value="custom_staff">custom_staff</option></select></label><label>Status<select id="mss"><option value="active">active</option><option value="inactive">inactive</option><option value="blocked">blocked</option></select></label><label>Payment Access<select id="msp"><option value="true">Unblocked</option><option value="false">Blocked</option></select></label><label>Loan Apply Access<select id="msla"><option value="true">Unblocked</option><option value="false">Blocked</option></select></label><label>Login ID Access<select id="msid"><option value="true">Unblocked</option><option value="false">Blocked</option></select></label><label>Commission %<input id="msc" type="number" min="0" step="0.01" value="${Number(x.commission_rate||0)}"></label><div class="full"><button class="btn green" onclick="saveStaffManage(${i})">Save Changes</button><button class="btn gray" onclick="staffView(${i})">Credentials</button><button class="btn blue" onclick="staffWallet(${i})">Open Wallet</button></div></div>`);$('msr').value=String(x.role||'custom_staff');$('mss').value=String(x.status||'active');$('msp').value=String(x.payment_enabled!==false);$('msla').value=String(x.loan_apply_enabled!==false);$('msid').value=String(x.login_enabled!==false)};
window.saveStaffManage=async i=>{try{const x=D.s[i],name=$('msn').value.trim();if(!name)return alert('Name is required.');const r=await db().from('staff').update({name,mobile:$('msm').value||null,email:$('mse').value||null,role:$('msr').value,status:$('mss').value,payment_enabled:$('msp').value==='true',loan_apply_enabled:$('msla').value==='true',login_enabled:$('msid').value==='true',commission_rate:Math.max(0,Number($('msc').value||0)),updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;closeM();await loadData();alert('Staff permissions updated successfully.')}catch(e){fail(e)}};
window.loadApplications=async function(){
 try{
  const r=await db().from('loan_applications').select('*').order('created_at',{ascending:false});
  if(r.error)throw r.error;
  D.a=r.data||[];
  const rows=D.a.map((x,i)=>{
   const status=String(x.status||'').toLowerCase();
   const cls=status==='approved'?'paid':(status==='rejected'?'over':(isPending(x)?'pending':''));
   return '<tr><td>'+esc(x.id??'-')+'</td><td>'+esc(x.full_name||'-')+'</td><td>'+esc(x.mobile||'-')+'</td><td>'+esc((x.applied_at||x.created_at||'').slice(0,10))+'</td><td>'+money(x.requested_amount||0)+'</td><td class="'+cls+'">'+esc(x.status||'-')+'</td><td><button class="btn gray" onclick="viewApp('+i+')">View</button></td></tr>';
  }).join('')||'<tr><td colspan="7">No applications found.</td></tr>';
  const body=$('appsRows'); if(body)body.innerHTML=rows;
  const n=$('nA'); if(n)n.textContent=D.a.length;
  return D.a;
 }catch(e){console.error('Applications load error:',e);alert('Applications load error: '+(e?.message||e));}
};
window.viewApp=i=>{if(!D.a[i])return alert('Application not found.');window.editApproval(i)};
window.editApproval=i=>{const rows=window.__HFY_APPLICATIONS||D.a||[];const x=rows[i];if(!x)return alert('Application not found.');openBox('Full Application — View / Edit',`<div class="form">
<label>Application ID<input id="av_id" value="${esc(x.id??'')}" readonly></label><label>Customer ID<input id="av_cid" value="${esc(x.customer_id??'')}" readonly></label>
<label>Full Name<input id="an" value="${esc(x.full_name||x.name||'')}"></label><label>Parent / Father / Mother Name<input id="apn" value="${esc(x.parent_name||'')}"></label>
<label>Mobile<input id="am" value="${esc(x.mobile||'')}"></label><label>Email<input id="ae" value="${esc(x.email||'')}"></label>
<label>DOB<input id="ad" type="date" value="${esc(x.date_of_birth||'')}"></label><label>Gender<input id="ag" value="${esc(x.gender||'')}"></label>
<label class="full">Address<input id="ax" value="${esc(x.address||'')}"></label><label>House<input id="ah" value="${esc(x.house||'')}"></label>
<label>Street<input id="astreet" value="${esc(x.street||'')}"></label><label>Village<input id="av" value="${esc(x.village||'')}"></label>
<label>Post Office<input id="apo" value="${esc(x.post_office||'')}"></label><label>City<input id="acity" value="${esc(x.city||'')}"></label>
<label>District<input id="adi" value="${esc(x.district||'')}"></label><label>State<input id="as" value="${esc(x.state||'')}"></label>
<label>Pincode<input id="ap" value="${esc(x.pincode||'')}"></label><label>Occupation<input id="ao" value="${esc(x.occupation||'')}"></label>
<label>Monthly Income<input id="ai" type="number" value="${x.monthly_income??''}"></label><label>PAN Number<input id="apan" value="${esc(x.pan_number||'')}"></label>
<label>Aadhaar Number<input id="aad" value="${esc(x.aadhaar_number||'')}"></label><label>Bank Account<input id="aba" value="${esc(x.bank_account||'')}"></label>
<label>IFSC Code<input id="aifsc" value="${esc(x.ifsc_code||'')}"></label><label>Loan Type<input id="alt" value="${esc(x.loan_type||'')}"></label>
<label class="full">Loan Purpose<input id="alp" value="${esc(x.loan_purpose||'')}"></label>
<label>Requested Amount<input id="arq" type="number" value="${x.requested_amount??x.loan_amount??0}"></label><label>Sanction / Approved Amount<input id="aa" type="number" value="${x.approved_amount??x.loan_amount??x.requested_amount??0}"></label>
<label>Loan Amount<input id="ala" type="number" value="${x.loan_amount??x.approved_amount??0}"></label><label>Tenure (Months)<select id="at"><option value="1">1 Month</option><option value="2">2 Months</option><option value="3">3 Months</option><option value="6">6 Months</option><option value="12">12 Months</option></select></label>
<label>Interest Rate %<input id="air" type="number" step="0.01" value="${x.interest_rate??0}"></label><label>EMI Amount<input id="aemi" type="number" step="0.01" value="${x.emi_amount??0}"></label>
<label>Daily EMI<input id="adaily" type="number" step="0.01" value="${x.daily_emi??0}"></label><label>Total Interest<input id="ati" type="number" step="0.01" value="${x.total_interest??0}"></label>
<label>Total Repayment<input id="atr" type="number" step="0.01" value="${x.total_repayment??0}"></label><label>Sanction Date<input id="asd" type="date" value="${esc(x.sanction_date||'')}"></label>
<label>Status<select id="ast"><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="pending">Pending</option><option value="under_review">Under Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
<label>KYC<select id="ak"><option>Pending</option><option>Under Review</option><option>Verified</option><option>Rejected</option></select></label><label>Bank Verification<input id="ab" value="${esc(x.bank_verification||'Pending')}"></label>
<label>Fraud Check<input id="af" value="${esc(x.fraud_check||'Pending')}"></label><label class="full">Admin Remarks<input id="ar" value="${esc(x.admin_remarks||'')}"></label>
<div class="full"><button class="btn blue" onclick="saveApproval(${i})">Save Full Form</button><button class="btn green" onclick="approve(${i})">Approve</button><button class="btn red" onclick="reject(${i})">Reject</button></div>
</div>`);$('at').value=String(x.tenure_months||1);$('ast').value=String(x.status||'submitted').toLowerCase();$('ak').value=x.kyc_status||'Pending';};function approval(){return {full_name:$('an').value.trim(),mobile:$('am').value.trim(),email:$('ae').value||null,date_of_birth:$('ad').value||null,gender:$('ag').value||null,parent_name:$('apn').value||null,address:$('ax').value||null,house:$('ah').value||null,street:$('astreet').value||null,village:$('av').value||null,post_office:$('apo').value||null,city:$('acity').value||null,district:$('adi').value||null,state:$('as').value||null,pincode:$('ap').value||null,pan_number:$('apan').value||null,aadhaar_number:$('aad').value||null,bank_account:$('aba').value||null,ifsc_code:$('aifsc').value||null,occupation:$('ao').value||null,monthly_income:Number($('ai').value||0)||null,loan_type:$('alt').value||null,loan_purpose:$('alp').value||null,requested_amount:Number($('arq').value||0),approved_amount:Number($('aa').value||0),loan_amount:Number($('ala').value||0)||null,tenure_months:Number($('at').value||1),interest_rate:Number($('air').value||0),emi_amount:Number($('aemi').value||0)||null,daily_emi:Number($('adaily').value||0)||null,total_interest:Number($('ati').value||0)||null,total_repayment:Number($('atr').value||0)||null,sanction_date:$('asd').value||null,status:$('ast').value,kyc_status:$('ak').value,bank_verification:$('ab').value||'Pending',fraud_check:$('af').value||'Pending',admin_remarks:$('ar').value||null}}
function customerFields(p){return {full_name:p.full_name,mobile:p.mobile,email:p.email,date_of_birth:p.date_of_birth,occupation:p.occupation,monthly_income:p.monthly_income,address:p.address,district:p.district,state:p.state,pincode:p.pincode,pan_number:p.pan_number,aadhaar_number:p.aadhaar_number,kyc_status:p.kyc_status,updated_at:new Date().toISOString()}}
window.saveApproval=async i=>{try{const x=D.a[i],p=approval();if(!p.full_name||!p.mobile)return alert('Name and Mobile are required.');if(p.requested_amount<1000||p.requested_amount>20000)return alert('Request loan amount must be ₹1,000 to ₹20,000.');if(p.approved_amount<1000||p.approved_amount>20000)return alert('Sanction loan amount must be ₹1,000 to ₹20,000.');let r=await db().from('loan_applications').update({...p,updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;if(x.customer_id){r=await db().from('customers').update(customerFields(p)).eq('id',x.customer_id);if(r.error)throw r.error}closeM();await loadData();alert('Update saved.')}catch(e){fail(e)}};
window.reject=async i=>{try{const r=await db().from('loan_applications').update({status:'rejected',updated_at:new Date().toISOString()}).eq('id',D.a[i].id);if(r.error)throw r.error;closeM();await loadData()}catch(e){fail(e)}};
window.approve=async i=>{try{const x=D.a[i],p=approval();if(p.requested_amount<1000||p.requested_amount>20000)return alert('Request loan amount must be ₹1,000 to ₹20,000.');if(p.approved_amount<1000||p.approved_amount>20000)return alert('Sanction loan amount must be ₹1,000 to ₹20,000.');const total=p.approved_amount*(1+.20*p.tenure_months),monthly=total/p.tenure_months,daily=monthly/30,start=today(),end=addDays(start,p.tenure_months*30);let r=await db().from('loan_applications').update({...p,status:'approved',approved_amount:p.approved_amount,interest_rate:20,emi_amount:monthly,daily_emi:daily,total_interest:total-p.requested_amount,total_repayment:total}).eq('id',x.id);if(r.error)throw r.error;let cid=x.customer_id;if(cid){r=await db().from('customers').update({...customerFields(p),status:'active'}).eq('id',cid);if(r.error)throw r.error}else{r=await db().from('customers').insert({...customerFields(p),status:'active'}).select('id').single();if(r.error)throw r.error;cid=r.data.id}let q=await db().from('loan_accounts').select('*').eq('application_id',x.id).maybeSingle();if(q.error)throw q.error;let loan=q.data;if(!loan){r=await db().from('loan_accounts').insert({application_id:x.id,customer_id:cid,loan_amount:p.approved_amount,total_repayment:total,tenure_months:p.tenure_months,daily_emi:daily,total_paid:0,remaining_amount:total,penalty_amount:0,loan_status:'active',start_date:start,end_date:end}).select('*').single();if(r.error)throw r.error;loan=r.data}let count=await db().from('loan_emi_schedule').select('id',{count:'exact',head:true}).eq('loan_account_id',loan.id);if(count.error)throw count.error;if(!count.count){const rows=[];for(let n=1;n<=p.tenure_months;n++)rows.push({loan_account_id:loan.id,loan_id:loan.loan_id,customer_id:cid,emi_number:n,due_date:addDays(start,n*30),emi_amount:monthly,penalty:0,paid_amount:0,status:'upcoming'});r=await db().from('loan_emi_schedule').insert(rows);if(r.error)throw r.error}closeM();await loadData();alert('Approved. Loan ID '+loan.loan_id+' generated and EMI schedule created.')}catch(e){fail(e)}};
window.addCustomer=()=>openBox('Add Customer',`<div class="form"><label>Name<input id="cn"></label><label>Mobile<input id="cm"></label><label>Email<input id="ce"></label><label>DOB<input id="cd" type="date"></label><label>Loan Amount<input id="ca" type="number" min="1000" max="20000"></label><label>Tenure<select id="ct"><option value="1">1 Month</option><option value="2">2 Months</option><option value="3">3 Months</option></select></label><label>Occupation<input id="co"></label><label>Income<input id="ci" type="number"></label><label class="full">Address<input id="cx"></label><label>District<input id="cdist"></label><label>State<input id="cstate"></label><label>Pincode<input id="cpin"></label><label>PAN<input id="cpan"></label><label>Aadhaar<input id="caa"></label><div class="full"><button class="btn green" onclick="saveCustomer()">Save Customer</button></div></div>`);
window.saveCustomer=async()=>{try{const name=$('cn').value.trim(),mobile=$('cm').value.trim(),amount=Number($('ca').value||0),tenure=Number($('ct').value||1);if(!name||!mobile)return alert('Name and Mobile are required.');if(amount<1000||amount>20000)return alert('Loan amount must be ₹1,000 to ₹20,000.');const p={full_name:name,mobile,email:$('ce').value||null,date_of_birth:$('cd').value||null,occupation:$('co').value||null,monthly_income:Number($('ci').value||0)||null,address:$('cx').value||null,district:$('cdist').value||null,state:$('cstate').value||null,pincode:$('cpin').value||null,pan_number:$('cpan').value||null,aadhaar_number:$('caa').value||null,kyc_status:'Pending',status:'active'};let r=await db().from('customers').insert(p).select('id').single();if(r.error)throw r.error;r=await db().from('loan_applications').insert({...p,customer_id:r.data.id,requested_amount:amount,interest_rate:20,tenure_months:tenure,status:'submitted',bank_verification:'Pending',fraud_check:'Pending'});if(r.error)throw r.error;closeM();await loadData();alert('Customer saved and sent to Approval.')}catch(e){fail(e)}};
window.editCustomer=i=>{const x=D.c[i];openBox('Customer View / Edit',`<div class="form"><label>Name<input id="en" value="${esc(x.full_name)}"></label><label>Mobile<input id="em" value="${esc(x.mobile)}"></label><label>Email<input id="ee" value="${esc(x.email||'')}"></label><label>DOB<input id="ed" type="date" value="${esc(x.date_of_birth||'')}"></label><label>Occupation<input id="eo" value="${esc(x.occupation||'')}"></label><label>Income<input id="ei" type="number" value="${x.monthly_income||''}"></label><label class="full">Address<input id="ex" value="${esc(x.address||'')}"></label><label>District<input id="edi" value="${esc(x.district||'')}"></label><label>State<input id="es" value="${esc(x.state||'')}"></label><label>Pincode<input id="ep" value="${esc(x.pincode||'')}"></label><label>PAN<input id="epan" value="${esc(x.pan_number||'')}"></label><label>Aadhaar<input id="eaa" value="${esc(x.aadhaar_number||'')}"></label><div class="full"><button class="btn blue" onclick="saveCustomerEdit(${i})">Save Changes</button></div></div>`)};
window.saveCustomerEdit=async i=>{try{const x=D.c[i],p={full_name:$('en').value.trim(),mobile:$('em').value.trim(),email:$('ee').value||null,date_of_birth:$('ed').value||null,occupation:$('eo').value||null,monthly_income:Number($('ei').value||0)||null,address:$('ex').value||null,district:$('edi').value||null,state:$('es').value||null,pincode:$('epin').value||null,pan_number:$('epan').value||null,aadhaar_number:$('eaa').value||null,updated_at:new Date().toISOString()};if(!p.full_name||!p.mobile)return alert('Name and Mobile are required.');let r=await db().from('customers').update(p).eq('id',x.id);if(r.error)throw r.error;closeM();await loadData()}catch(e){fail(e)}};
window.deleteCustomer=async i=>{if(!confirm('Delete customer and pending application?'))return;try{const x=D.c[i];let r=await db().from('loan_applications').delete().eq('customer_id',x.id).in('status',['draft','submitted','under_review']);if(r.error)throw r.error;r=await db().from('customers').delete().eq('id',x.id);if(r.error)throw r.error;await loadData()}catch(e){fail(e)}};
window.viewEmi=i=>{const x=D.e[i];openBox('EMI Details',`<p>Customer: <b>${esc(customerName(x.customer_id))}</b></p><p>Loan ID: <b>${esc(x.loan_id)}</b></p><p>EMI No: <b>${x.emi_number}</b></p><p>Due: <b>${esc(x.due_date)}</b></p><p>Amount: <b>${money(x.emi_amount)}</b></p><p>Penalty: <b>${money(x.penalty)}</b></p><p>Paid: <b>${money(x.paid_amount)}</b></p><p>Remaining: <b>${money(x.remaining_amount)}</b></p><button class="btn green" onclick="paid('${x.id}')">Paid</button>`)};
window.paid=async id=>{try{const x=D.e.find(e=>String(e.id)===String(id));const r=await db().from('loan_emi_schedule').update({paid_amount:Number(x.emi_amount||0)+Number(x.penalty||0),status:'paid',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;closeM();await loadData()}catch(e){fail(e)}};
window.addEmi=()=>{if(!D.l.length)return alert('No approved loan available.');const l=D.l[0];openBox('Add EMI',`<label>Loan ID<input value="${l.loan_id}" readonly></label><label>EMI No<input id="eno" type="number"></label><label>Due Date<input id="edate" type="date" value="${today()}"></label><label>Amount<input id="eamt" type="number" value="${Number(l.daily_emi||0)*30}"></label><button class="btn green" onclick="saveNewEmi('${l.id}','${l.loan_id}','${l.customer_id}')">Add EMI</button>`) };
window.saveNewEmi=async(a,l,c)=>{try{const r=await db().from('loan_emi_schedule').insert({loan_account_id:a,loan_id:Number(l),customer_id:Number(c),emi_number:Number($('eno').value),due_date:$('edate').value,emi_amount:Number($('eamt').value),penalty:0,paid_amount:0,status:'upcoming'});if(r.error)throw r.error;closeM();await loadData()}catch(e){fail(e)}};

window.addStaff=()=>openBox('Add Staff',`<label>Name<input id="sn"></label><label>Mobile<input id="sm"></label><label>Email<input id="se"></label><label>Role<select id="sr"><option>verifier</option><option>loan_officer</option><option>collection_officer</option><option>manager</option><option>custom_staff</option></select></label><button class="btn green" onclick="saveStaff()">Generate ID & Password</button>`);
window.saveStaff=async()=>{try{const name=$('sn').value.trim();if(!name)return alert('Name is required.');const employee='HFY-'+Date.now().toString().slice(-6),login='HFY'+Date.now().toString().slice(-6),password=Math.random().toString(36).slice(2,10).toUpperCase();let r=await db().from('staff').insert({employee_id:employee,name,mobile:$('sm').value||null,email:$('se').value||null,role:$('sr').value,status:'active'}).select('id').single();if(r.error)throw r.error;r=await db().from('staff_credentials').insert({staff_id:r.data.id,login_id:login,login_password:password});if(r.error)throw r.error;r=await db().from('staff_permissions').insert({staff_id:r.data.id});if(r.error)throw r.error;await loadData();openBox('Staff Login Created',`<p>Employee ID: <b>${esc(employee)}</b></p><p>Login ID: <b>${esc(login)}</b></p><p>Password: <b>${esc(password)}</b></p>`)}catch(e){fail(e)}};
window.staffView=async i=>{try{const s=D.s[i],r=await db().from('staff_credentials').select('login_id,login_password').eq('staff_id',s.id).maybeSingle();if(r.error)throw r.error;openBox('Staff Credentials',`<p>Employee ID: <b>${esc(s.employee_id)}</b></p><p>Login ID: <b>${esc(r.data?.login_id||'-')}</b></p><p>Password: <b>${esc(r.data?.login_password||'-')}</b></p>`)}catch(e){fail(e)}};
window.renderPayments=renderPayments;
window.renderPaymentCustomerList=renderPaymentCustomerList;
window.renderTransactions=renderTransactions;
window.renderOverdue=renderOverdue;
window.renderStaff=renderStaff;
window.renderCore=render;
loadData();
})();
window.staffWallet=async i=>{try{const x=D.s[i];if(!x)return;const w=D.w.find(z=>String(z.staff_id)===String(x.id));const tx=await db().from('staff_wallet_transactions').select('*').eq('staff_id',x.id).order('created_at',{ascending:false}).limit(100);if(tx.error)throw tx.error;const rows=(tx.data||[]).map(t=>`<tr><td>${esc((t.created_at||'').slice(0,19).replace('T',' '))}</td><td>${esc(t.transaction_type||'commission')}</td><td>${money(t.recovered_amount)}</td><td>${Number(t.commission_rate||0).toFixed(2)}%</td><td>${money(t.commission_amount)}</td><td>${esc(t.remarks||'Recovery commission')}</td></tr>`).join('')||'<tr><td colspan="6">No wallet transactions.</td></tr>';openBox('Staff Wallet — '+esc(x.name),`<div class="card"><p>Employee ID: <b>${esc(x.employee_id)}</b></p><p>Wallet Balance: <b>${money(w?.balance||0)}</b></p><p>Commission Rate: <b>${Number(x.commission_rate||0).toFixed(2)}%</b></p></div><div class="actions"><button class="btn green" onclick="addStaffCommission(${i})">+ Add Recovery Commission</button><button class="btn blue" onclick="addStaffBonus(${i})">+ Add Bonus</button><button class="btn red" onclick="deductStaffWallet(${i})">− Deduct Wallet</button></div><div class="wrap"><table><tr><th>Date</th><th>Type</th><th>Recovered</th><th>Rate</th><th>Commission / Bonus</th><th>Remarks</th></tr>${rows}</table></div>`)}catch(e){fail(e)}};
window.addStaffCommission=async i=>{const x=D.s[i];if(!x)return;openBox('Add Recovery Commission',`<div class="form"><label>Staff<input value="${esc(x.name)}" readonly></label><label>Recovered Amount<input id="wra" type="number" min="0.01" step="0.01"></label><label>Commission %<input id="wrr" type="number" min="0" step="0.01" value="${Number(x.commission_rate||0)}"></label><label>Customer ID<input id="wrc" type="number"></label><label>Loan Account UUID<input id="wrl"></label><label>Repayment UUID<input id="wrp"></label><label class="full">Remarks<input id="wrrm" placeholder="Recovery commission"></label><div class="full"><button class="btn green" onclick="saveStaffCommission(${i})">Credit Wallet</button></div></div>`)};
window.saveStaffCommission=async i=>{try{const x=D.s[i],amount=Number($('wra').value||0),rate=Number($('wrr').value||0);if(amount<=0)return alert('Enter recovered amount.');const r=await db().rpc('hfy_add_staff_commission',{p_staff_id:x.id,p_customer_id:Number($('wrc').value||0)||null,p_loan_account_id:$('wrl').value.trim()||null,p_repayment_id:$('wrp').value.trim()||null,p_recovered_amount:amount,p_commission_rate:rate,p_remarks:$('wrrm').value.trim()||null});if(r.error)throw r.error;closeM();await loadData();alert('Recovery commission credited to wallet: '+money(r.data?.commission||0));}catch(e){fail(e)}};

window.addStaffBonus=async i=>{const x=D.s[i];if(!x)return;openBox('Add Staff Bonus',`<div class="form"><label>Staff<input value="${esc(x.name)}" readonly></label><label>Bonus Amount<input id="wba" type="number" min="0.01" step="0.01" placeholder="Enter bonus amount"></label><label class="full">Remarks<input id="wbr" placeholder="Staff bonus"></label><div class="full"><button class="btn green" onclick="saveStaffBonus(${i})">Add Bonus to Wallet</button></div></div>`)};
window.saveStaffBonus=async i=>{try{const x=D.s[i],amount=Number($('wba').value||0);if(amount<=0)return alert('Enter bonus amount.');const r=await db().rpc('hfy_add_staff_bonus',{p_staff_id:x.id,p_bonus_amount:amount,p_remarks:$('wbr').value.trim()||null});if(r.error)throw r.error;closeM();await loadData();alert('Staff bonus added to wallet: '+money(r.data?.bonus||amount));}catch(e){fail(e)}};
window.deductStaffWallet=async i=>{const x=D.s[i];if(!x)return;openBox('Deduct Staff Wallet',`<div class="form"><label>Staff<input value="${esc(x.name)}" readonly></label><label>Deduction Amount<input id="wda" type="number" min="0.01" step="0.01" placeholder="Enter amount to deduct"></label><label class="full">Reason / Remarks<input id="wdr" placeholder="Reason for deduction"></label><div class="full"><button class="btn red" onclick="saveStaffWalletDeduction(${i})">Deduct From Wallet</button></div></div>`)};
window.saveStaffWalletDeduction=async i=>{try{const x=D.s[i],amount=Number($('wda').value||0);if(amount<=0)return alert('Enter deduction amount.');const r=await db().rpc('hfy_deduct_staff_wallet',{p_staff_id:x.id,p_amount:amount,p_remarks:$('wdr').value.trim()||null});if(r.error)throw r.error;closeM();await loadData();alert('Wallet deducted successfully: '+money(r.data?.deducted_amount||amount));}catch(e){fail(e)}};



window.renderWithdrawals=async function(){
 try{
  const box=document.getElementById('withdrawals');if(!box)return;
  const client=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const r=await client.from('staff_wallet_withdrawals').select('*').order('requested_at',{ascending:false}).limit(100);
  if(r.error)throw r.error;
  const staffMap={};(window.__HFY_STAFF||[]).forEach(s=>staffMap[String(s.id)]=s);
  const rows=(r.data||[]).map(v=>{
   const s=staffMap[String(v.staff_id)],st=String(v.status||'pending').toLowerCase();
   const actions=st==='pending'
    ? '<button class="btn green" data-wid="'+v.id+'" data-wstatus="approved">Accept</button> <button class="btn red" data-wid="'+v.id+'" data-wstatus="rejected">Reject</button>'
    : '-';
   return '<tr><td>'+v.id+'</td><td>'+(s?.name||'Staff #'+v.staff_id)+'</td><td>₹'+Number(v.amount||0).toFixed(2)+'</td><td>'+st+'</td><td>'+String(v.requested_at||'').slice(0,19).replace('T',' ')+'</td><td>'+(v.remarks||'-')+'</td><td>'+actions+'</td></tr>';
  }).join('')||'<tr><td colspan="7">No withdrawal requests found.</td></tr>';
  box.innerHTML='<h2>💸 Withdrawal Requests</h2><div class="wrap"><table><thead><tr><th>ID</th><th>Staff</th><th>Amount</th><th>Status</th><th>Requested</th><th>Remarks</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  box.querySelectorAll('[data-wid]').forEach(btn=>btn.addEventListener('click',()=>window.reviewStaffWithdrawal(Number(btn.dataset.wid),btn.dataset.wstatus)));
 }catch(e){console.error(e);alert('Withdrawal data error: '+(e?.message||e));}
};

/* Staff Wallet — withdrawal review */
(function(){
'use strict';
const _staffWallet=window.staffWallet;
window.staffWallet=async function(i){
  if(!D.s[i]&&window.__HFY_STAFF&&window.__HFY_STAFF[i])D.s[i]=window.__HFY_STAFF[i];
  await _staffWallet(i);
  try{
    const x=D.s[i];
    const r=await db().from('staff_wallet_withdrawals').select('*').eq('staff_id',x.id).order('requested_at',{ascending:false}).limit(50);
    if(r.error)throw r.error;
    const esc2=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const rows=(r.data||[]).map(v=>{
      const s=String(v.status||'pending').toLowerCase();
      const actions=s==='pending'?' <button class="btn green" onclick="reviewStaffWithdrawal(\''+esc2(String(v.id))+'\',\'approved\','+i+')">Accept</button> <button class="btn red" onclick="reviewStaffWithdrawal(\''+esc2(String(v.id))+'\',\'rejected\','+i+')">Reject</button>':'-';
      return '<tr><td>'+esc2((v.requested_at||v.created_at||'').slice(0,19).replace('T',' '))+'</td><td>'+money(v.amount)+'</td><td>'+esc2(v.status||'pending')+'</td><td>'+esc2(v.remarks||'-')+'</td><td>'+actions+'</td></tr>';
    }).join('')||'<tr><td colspan="5">No withdrawal requests.</td></tr>';
    const mb=document.getElementById('mb');
    if(mb)mb.innerHTML+='<h3>Withdrawal Requests</h3><div class="wrap"><table><tr><th>Requested</th><th>Amount</th><th>Status</th><th>Remarks</th><th>Action</th></tr>'+rows+'</table></div>';
  }catch(e){fail(e)}
};
window.reviewStaffWithdrawal=async function(id,status){
 try{
  const client=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const r=await client.rpc('hfy_review_staff_withdrawal',{p_withdrawal_id:id,p_status:status});
  if(r.error)throw r.error;
  await window.renderWithdrawals();
  alert('Withdrawal '+(status==='approved'?'accepted':'rejected')+' successfully.');
 }catch(e){console.error(e);alert('Withdrawal action error: '+(e?.message||e));}
}
})();
