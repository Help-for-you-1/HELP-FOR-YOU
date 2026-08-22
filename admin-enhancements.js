/* HELP FOR YOU — permanent admin editing + EMI enhancement layer
   Keeps the existing admin.html design and adds editable records/EMI/payment views. */
(function(){
'use strict';

function $id(id){return document.getElementById(id)}
function esc2(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function money2(v){return Number(v||0).toFixed(2)}
function modal2(title,html){
  if(typeof openBox==='function') openBox(title,html);
}
function close2(){if(typeof closeM==='function') closeM()}

async function refresh(){
  try{ if(typeof loadData==='function') await loadData(); }catch(e){console.error(e)}
  setTimeout(enhanceTables,150);
}

/* ---------- APPLICATION EDIT ---------- */
window.editApplication=function(i){
  const x=db.applications[i];
  if(!x)return;
  modal2('Edit Application',`<div class="form">
<label>Full Name<input id="ae_name" value="${esc2(x.name)}"></label>
<label>Mobile<input id="ae_mobile" value="${esc2(x.mobile)}"></label>
<label>Apply Date<input id="ae_date" type="date" value="${esc2(x.date)}"></label>
<label>Loan Amount<input id="ae_amount" type="number" value="${Number(x.amount||0)}"></label>
<label>Email<input id="ae_email" value="${esc2(x.email||'')}"></label>
<label>KYC Status<input id="ae_kyc" value="${esc2(x.kyc||'')}"></label>
<label>PAN<input id="ae_pan" value="${esc2(x.pan_number||x.pan||'')}"></label>
<label>Aadhaar<input id="ae_aad" value="${esc2(x.aadhaar_number||x.aadhaar||'')}"></label>
<label>State<input id="ae_state" value="${esc2(x.state||'')}"></label>
<label>District<input id="ae_district" value="${esc2(x.district||'')}"></label>
<label>Pincode<input id="ae_pin" value="${esc2(x.pincode||'')}"></label>
<label class="full">Address<input id="ae_address" value="${esc2(x.address||'')}"></label>
<div class="full"><button class="btn blue" onclick="saveApplicationEdit(${i})">Save Changes</button></div>
</div>`);
};
window.saveApplicationEdit=async function(i){
  const x=db.applications[i];
  if(!x)return;
  const u={name:$id('ae_name').value,full_name:$id('ae_name').value,mobile:$id('ae_mobile').value,requested_amount:+$id('ae_amount').value,kyc_status:$id('ae_kyc').value||null,pan_number:$id('ae_pan').value||null,aadhaar_number:$id('ae_aad').value||null,state:$id('ae_state').value||null,district:$id('ae_district').value||null,pincode:$id('ae_pin').value||null,address:$id('ae_address').value||null};
  const r=await sb.from('loan_applications').update(u).eq('id',x.id);
  if(r.error)return alert('Application update failed: '+r.error.message);
  close2();await refresh();alert('Application updated successfully');
};

/* ---------- CUSTOMER/LOAN EDIT ---------- */
window.editLoan=function(i){
 const x=db.customers[i]; if(!x)return;
 modal2('Edit Loan Account',`<div class="form">
<label>Loan ID<input id="le_id" value="${esc2(x.loanId)}"></label>
<label>Approved Loan Amount<input id="le_amount" type="number" value="${Number(x.amount||0)}"></label>
<label>Tenure (Months)<input id="le_months" type="number" value="${Number(x.months||0)}"></label>
<label>Daily EMI<input id="le_daily" type="number" step="0.01" value="${Number(x.emi||0)/30}"></label>
<label>Sanction Date<input id="le_start" type="date" value="${esc2(x.sanction)}"></label>
<label>Loan Status<select id="le_status"><option value="active">Active</option><option value="closed">Closed</option><option value="overdue">Overdue</option></select></label>
<label>Total Repayment<input id="le_total" type="number" step="0.01" value="${Number(x.totalLoan||0)}"></label>
<label>Remaining Amount<input id="le_remaining" type="number" step="0.01" value="${Number(x.totalDue||0)}"></label>
<div class="full"><button class="btn green" onclick="saveLoanEdit(${i})">Save Loan</button></div>
</div>`);
 const s=$id('le_status'); if(s)s.value=x.status||'active';
};
window.saveLoanEdit=async function(i){
 const x=db.customers[i]; if(!x)return;
 const r=await sb.from('loan_accounts').update({loan_id:+$id('le_id').value,loan_amount:+$id('le_amount').value,tenure_months:+$id('le_months').value,daily_emi:+$id('le_daily').value,total_repayment:+$id('le_total').value,remaining_amount:+$id('le_remaining').value,start_date:$id('le_start').value||null,loan_status:$id('le_status').value}).eq('id',x.accountId);
 if(r.error)return alert('Loan update failed: '+r.error.message);
 close2();await refresh();alert('Loan updated successfully');
};

/* ---------- EMI: full editable schedule ---------- */
window.editEmiFull=window.editEmi;
window.addEmi=function(){
 modal2('Add EMI',`<div class="form">
<label>Loan ID<input id="el"></label>
<label>Due Date<input id="ed" type="date"></label>
<label>EMI Amount<input id="ea2" type="number" step="0.01"></label>
<label>Overdue Days<input id="days" type="number" min="0" value="0"></label>
<label>Status<select id="st"><option value="pending">Pending</option><option value="overdue">Overdue</option><option value="paid">Paid</option></select></label>
<label>Paid Amount<input id="paid2" type="number" step="0.01" value="0"></label>
<div class="full"><button class="btn blue" onclick="saveEmiEnhanced()">Save EMI</button></div></div>`);
};
window.saveEmiEnhanced=async function(){
 const loan=String($id('el').value||'').trim(), amount=+$id('ea2').value||0, days=+$id('days').value||0, status=$id('st').value, paid=+$id('paid2').value||0;
 if(!loan||!$id('ed').value||amount<=0)return alert('Loan ID, Due Date and EMI Amount are required');
 const r=await sb.from('loan_accounts').select('id,loan_id,customer_id').eq('loan_id',loan).maybeSingle();
 if(r.error||!r.data)return alert(r.error?.message||'Loan ID not found');
 const penalty=status==='overdue'?amount*.02*days:0,total=amount+penalty,paidAmount=status==='paid'?total:Math.min(Math.max(0,paid),total);
 const q=await sb.from('loan_emi_schedule').select('emi_number').eq('loan_id',r.data.loan_id).order('emi_number',{ascending:false}).limit(1);
 const no=(q.data?.[0]?.emi_number||0)+1;
 const z=await sb.from('loan_emi_schedule').insert({loan_account_id:r.data.id,loan_id:r.data.loan_id,customer_id:r.data.customer_id,emi_number:no,due_date:$id('ed').value,emi_amount:amount,penalty,total_due:total,paid_amount:paidAmount,remaining_amount:Math.max(0,total-paidAmount),status});
 if(z.error)return alert('EMI save failed: '+z.error.message);
 close2();await refresh();alert('EMI added successfully');
};

/* ---------- PAYMENTS / TRANSACTIONS ---------- */
async function loadLedger(){
 try{
  const p=await sb.from('loan_repayments').select('*').order('payment_date',{ascending:false});
  const t=await sb.from('financial_transactions').select('*').order('transaction_date',{ascending:false});
  const pp=p.error?[]:(p.data||[]), tt=t.error?[]:(t.data||[]);
  const pc=$id('payments');
  if(pc)pc.innerHTML='<h2>Payments</h2><div class="wrap"><table><thead><tr><th>ID</th><th>Loan ID</th><th>Amount</th><th>Date</th><th>Method</th><th>Status</th><th>Reference</th><th>Action</th></tr></thead><tbody>'+(
   pp.map((x,i)=>`<tr><td>${esc2(x.id)}</td><td>${esc2(x.loan_id||'')}</td><td>₹${money2(x.amount)}</td><td>${esc2((x.payment_date||x.created_at||'').toString().slice(0,10))}</td><td>${esc2(x.payment_method||'')}</td><td>${esc2(x.status||'')}</td><td>${esc2(x.reference_number||'')}</td><td><button class="btn blue" onclick="editPayment(${i})">Edit</button></td></tr>`).join('')||'<tr><td colspan="8">No payments.</td></tr>')+'</tbody></table></div><button class="btn blue" onclick="addPayment()">+ Add Payment</button>';
  window.__hfyPayments=pp;
  const tc=$id('transactions');
  if(tc)tc.innerHTML='<h2>Transactions</h2><div class="wrap"><table><thead><tr><th>ID</th><th>Customer</th><th>Loan</th><th>Type</th><th>Amount</th><th>Status</th><th>Reference</th><th>Date</th></tr></thead><tbody>'+(
   tt.map(x=>`<tr><td>${esc2(x.transaction_id||x.id||'')}</td><td>${esc2(x.customer_id||'')}</td><td>${esc2(x.loan_account_id||x.loan_id||'')}</td><td>${esc2(x.transaction_type||'')}</td><td>₹${money2(x.amount)}</td><td>${esc2(x.status||'')}</td><td>${esc2(x.reference_number||'')}</td><td>${esc2((x.transaction_date||x.created_at||'').toString().slice(0,10))}</td></tr>`).join('')||'<tr><td colspan="8">No transactions.</td></tr>')+'</tbody></table></div>';
 }catch(e){console.error('ledger',e)}
}
window.addPayment=function(){
 modal2('Add Payment',`<div class="form"><label>Loan ID<input id="pay_loan"></label><label>Amount<input id="pay_amount" type="number" step="0.01"></label><label>Date<input id="pay_date" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Payment Method<input id="pay_method" value="other"></label><label>Reference Number<input id="pay_ref"></label><label>Status<select id="pay_status"><option value="successful">Successful</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="reversed">Reversed</option></select></label><label class="full">Remarks<input id="pay_notes"></label><div class="full"><button class="btn green" onclick="savePayment()">Save Payment</button></div></div>`);
};
window.savePayment=async function(){
 const loan=+$id('pay_loan').value, amount=+$id('pay_amount').value||0;if(!loan||amount<=0)return alert('Loan ID and Amount are required');
 const a=await sb.from('loan_accounts').select('id,loan_id,customer_id').eq('loan_id',loan).maybeSingle();if(a.error||!a.data)return alert(a.error?.message||'Loan ID not found');
 const r=await sb.from('loan_repayments').insert({loan_account_id:a.data.id,loan_id:a.data.loan_id,customer_id:a.data.customer_id,amount,payment_date:$id('pay_date').value,payment_method:$id('pay_method').value,status:$id('pay_status').value,reference_number:$id('pay_ref').value||null,remarks:$id('pay_notes').value||null});
 if(r.error)return alert('Payment save failed: '+r.error.message);close2();await refresh();await loadLedger();alert('Payment saved successfully');
};
window.editPayment=function(i){const x=window.__hfyPayments?.[i];if(!x)return;modal2('Edit Payment',`<div class="form"><label>Amount<input id="pe_amount" type="number" step="0.01" value="${Number(x.amount||0)}"></label><label>Date<input id="pe_date" type="date" value="${esc2((x.payment_date||'').slice(0,10))}"></label><label>Method<input id="pe_method" value="${esc2(x.payment_method||'other')}"></label><label>Status<select id="pe_status"><option value="successful">Successful</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="reversed">Reversed</option></select></label><label>Reference<input id="pe_ref" value="${esc2(x.reference_number||'')}"></label><label class="full">Remarks<input id="pe_notes" value="${esc2(x.remarks||'')}"></label><div class="full"><button class="btn green" onclick="savePaymentEdit('${esc2(x.id)}')">Save Changes</button></div></div>`);$id('pe_status').value=x.status||'successful';};
window.savePaymentEdit=async function(id){const r=await sb.from('loan_repayments').update({amount:+$id('pe_amount').value,payment_date:$id('pe_date').value,payment_method:$id('pe_method').value,status:$id('pe_status').value,reference_number:$id('pe_ref').value||null,remarks:$id('pe_notes').value||null}).eq('id',id);if(r.error)return alert('Payment update failed: '+r.error.message);close2();await refresh();await loadLedger();alert('Payment updated successfully')};

/* Add edit controls without changing the existing layout. */
function enhanceTables(){
 const rows=$id('appsRows');
 if(rows)rows.querySelectorAll('tr').forEach((tr,i)=>{const b=tr.querySelector('button');if(b&&!tr.querySelector('.hfy-edit-app')){const e=document.createElement('button');e.className='btn blue hfy-edit-app';e.textContent='Edit';e.onclick=()=>editApplication(i);tr.lastElementChild.appendChild(e)}});
 const cr=$id('cuRows');
 if(cr)cr.querySelectorAll('tr').forEach((tr,i)=>{if(!tr.querySelector('.hfy-edit-loan')&&db.customers[i]){const e=document.createElement('button');e.className='btn gray hfy-edit-loan';e.textContent='Loan Edit';e.onclick=()=>editLoan(i);tr.lastElementChild.appendChild(e)}});
}

function start(){
 setTimeout(()=>{enhanceTables();loadLedger()},700);
 setInterval(enhanceTables,1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
