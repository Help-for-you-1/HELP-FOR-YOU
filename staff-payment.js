/* HELP FOR YOU — STAFF EMI PAYMENT ONLY. Pay Now uses the same payment flow as Customer Portal. */
(function(){
'use strict';
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const dt=v=>v?new Date(v).toLocaleDateString('en-IN'):'';
function getCache(){return window.staffCache||window.cache||{customers:[],loans:[],emis:[]}}
function modal(title,html){
 let m=document.getElementById('staffPayModal');
 if(!m){
  m=document.createElement('div');m.id='staffPayModal';
  m.className='modal';
  m.style='position:fixed;inset:0;background:#0008;display:none;align-items:center;justify-content:center;padding:18px;z-index:9999';
  m.innerHTML='<div style="background:#fff;border-radius:14px;padding:22px;width:min(460px,100%);max-height:92vh;overflow:auto"><h2 id="staffModalTitle">Pay EMI</h2><div id="staffModalBody"></div></div>';
  document.body.appendChild(m);
 }
 document.getElementById('staffModalTitle').textContent=title;
 document.getElementById('staffModalBody').innerHTML=html;
 m.style.display='flex';
}
function closeModal(){const m=document.getElementById('staffPayModal');if(m)m.style.display='none'}
function openPay(emi){
 if(!emi||!emi.loan_account_id){alert('Loan account not found');return}
 const total=Number(emi.total_due||Number(emi.emi_amount||0)+Number(emi.penalty||0));
 const paid=Number(emi.paid_amount||0);
 const remaining=Math.max(0,total-paid);
 if(remaining<=0){alert('This EMI is already paid.');return}
 modal('Pay EMI',`<div>
 <div class="muted" style="margin-bottom:12px">EMI ${esc(emi.emi_number)} • Due ${esc(emi.due_date)} • Remaining ${money(remaining)}</div>
 <label>Payment Method</label>
 <select id="staffPaymentType" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #d9dee7;border-radius:8px"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option></select>
 <label>Amount</label>
 <input id="staffPaymentAmount" type="number" min="1" max="${remaining}" step="0.01" value="${remaining.toFixed(2)}" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #d9dee7;border-radius:8px">
 <label>Reference / Remarks</label>
 <textarea id="staffPaymentRemarks" rows="3" placeholder="Optional" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #d9dee7;border-radius:8px"></textarea>
 <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn gray" id="staffCancelPay">Cancel</button><button class="btn green" id="staffConfirmPay">Pay Now</button></div>
 </div>`);
 document.getElementById('staffCancelPay').onclick=closeModal;
 document.getElementById('staffConfirmPay').onclick=()=>submitPay(emi,remaining);
}
async function submitPay(emi,remaining){
 const amount=Number(document.getElementById('staffPaymentAmount')?.value||0);
 if(amount<=0){alert('Enter a valid payment amount');return}
 if(amount>remaining){alert('Payment amount cannot exceed EMI remaining amount');return}
 const btn=document.getElementById('staffConfirmPay');btn.disabled=true;btn.textContent='Processing...';
 try{
  if(!window.supabase||!window.HFY_SUPABASE_URL||!window.HFY_SUPABASE_PUBLISHABLE_KEY)throw new Error('Payment connection unavailable');
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const paymentType=document.getElementById('staffPaymentType').value;
  const remarks=document.getElementById('staffPaymentRemarks').value.trim()||null;
  const {data,error}=await sb.rpc('hfy_record_payment',{p_loan_account_id:emi.loan_account_id,p_amount:amount,p_payment_date:new Date().toISOString().slice(0,10),p_payment_type:paymentType,p_remarks:remarks});
  if(error)throw error;
  if(!data?.success)throw new Error(data?.message||'Payment failed');
  closeModal();
  alert('Payment successful. Transaction: '+(data.transaction_id||'—'));
  if(typeof window.load==='function')await window.load();
 }catch(e){alert(e.message||String(e))}finally{btn.disabled=false;btn.textContent='Pay Now'}
}
window.staffOpenEmiPayment=openPay;
window.staffConfirmEmiPay=submitPay;
function viewCustomerEmis(customerId,loanId){
 const cache=getCache();
 const rows=(cache.emis||[]).filter(e=>String(e.customer_id)===String(customerId)&&(!loanId||String(e.loan_account_id||e.loan_id)===String(loanId)));
 const c=(cache.customers||[]).find(x=>String(x.id)===String(customerId));
 const loan=(cache.loans||[]).find(x=>String(x.id)===String(loanId)||String(x.loan_id)===String(loanId));
 let total=0,paid=0,penalty=0;rows.forEach(e=>{total+=Number(e.total_due||0);paid+=Number(e.paid_amount||0);penalty+=Number(e.penalty||0)});
 modal('Full EMI List',`<p><b>Name:</b> ${esc(c?.full_name||'Customer')} &nbsp; <b>Loan ID:</b> ${esc(loan?.loan_id||loanId||'')} &nbsp; <b>Mobile:</b> ${esc(c?.mobile||'')} </p><div class="wrap"><table><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(e=>{const rem=Number(e.remaining_amount??Math.max(Number(e.total_due||0)-Number(e.paid_amount||0),0));const st=String(e.status||'pending').toLowerCase();return `<tr><td>${esc(e.emi_number)}</td><td>${dt(e.due_date)}</td><td>${money(e.emi_amount)}</td><td>${money(e.penalty)}</td><td>${money(e.total_due)}</td><td>${money(e.paid_amount)}</td><td>${money(rem)}</td><td>${esc(st)}</td><td>${rem>0?`<button class="btn green" onclick="staffOpenEmiPayment(window.staffCache.emis.find(z=>String(z.id)===String('${esc(e.id)}')))" >Pay Now</button>`:'<b class="paid">Paid</b>'}</td></tr>`}).join('')}</tbody></table></div><p><b>Total EMI:</b> ${rows.length} &nbsp; <b>Total Paid:</b> ${money(paid)} &nbsp; <b>Remaining:</b> ${money(Math.max(total-paid,0))} &nbsp; <b>Penalty:</b> ${money(penalty)}</p>`)
}
window.viewCustomerEmis=viewCustomerEmis;
window.renderEmi=function(){
 const cache=getCache();const rows=cache.emis||[];const groups={};rows.forEach(e=>{const key=String(e.customer_id)+'|'+String(e.loan_account_id||e.loan_id);(groups[key]??=[]).push(e)});
 const out=Object.values(groups).map(g=>{const e=g[0],c=(cache.customers||[]).find(x=>String(x.id)===String(e.customer_id)),loan=(cache.loans||[]).find(x=>String(x.id)===String(e.loan_account_id)||String(x.loan_id)===String(e.loan_id));const sanction=Number(loan?.loan_amount||0),totalLoan=Number(loan?.total_repayment||g.reduce((s,x)=>s+Number(x.total_due||0),0)),over=g.filter(x=>x.status==='overdue').reduce((s,x)=>s+Number(x.remaining_amount||0),0),remaining=g.reduce((s,x)=>s+Number(x.remaining_amount||0),0),status=remaining<=0?'paid':g.some(x=>x.status==='overdue')?'overdue':'pending';return `<tr><td>${esc(c?.full_name||'Customer')}</td><td>${esc(loan?.loan_id||e.loan_id||'')}</td><td>${esc(c?.mobile||'')}</td><td>${money(sanction)}</td><td>${money(totalLoan)}</td><td>${dt(loan?.start_date||e.due_date)}</td><td>${money(over)}</td><td class="${status==='paid'?'paid':status==='overdue'?'over':'pending'}">${status}</td><td><button class="btn blue" onclick="viewCustomerEmis('${esc(e.customer_id)}','${esc(e.loan_account_id||e.loan_id)}')">View</button></td></tr>`}).join('');const el=document.getElementById('emiRows');if(el)el.innerHTML=out||'<tr><td colspan="9">No EMI records</td></tr>';
};
setTimeout(()=>{if(typeof window.renderEmi==='function')window.renderEmi()},100);
setInterval(()=>{if(document.getElementById('emi')?.classList.contains('on')&&typeof window.renderEmi==='function')window.renderEmi()},1500);
})();
