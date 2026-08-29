/* HELP FOR YOU — STAFF EMI PAYMENT ONLY. Existing staff EMI flow preserved; Pay Now opens the payment options directly. */
(function(){
'use strict';
const UPI='Q526188998@ybl';
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dt=v=>v?new Date(v).toLocaleDateString('en-IN'):'';
function modal(title,html){
 let m=document.getElementById('staffPayModal');
 if(!m){
  m=document.createElement('div');m.id='staffPayModal';
  m.style='display:none;position:fixed;inset:0;background:#0008;z-index:9999;align-items:center;justify-content:center;padding:15px';
  m.innerHTML='<div style="background:#fff;border-radius:16px;padding:22px;width:min(1000px,100%);max-height:92vh;overflow:auto"><button id="staffPayClose" style="float:right;border:0;background:#eee;padding:8px 12px;border-radius:7px;cursor:pointer">Close</button><h2 id="staffModalTitle"></h2><div id="staffModalBody"></div></div>';
  document.body.appendChild(m);
  document.getElementById('staffPayClose').onclick=()=>m.style.display='none';
 }
 document.getElementById('staffModalTitle').textContent=title;
 document.getElementById('staffModalBody').innerHTML=html;
 m.style.display='flex';
}
function openPay(x){
 const total=Math.max(0,Number(x.total_due||0)-Number(x.paid_amount||0));
 if(total<=0){alert('This EMI is already paid.');return}
 const uri='upi://pay?pa='+encodeURIComponent(UPI)+'&pn='+encodeURIComponent('HELP FOR YOU')+'&am='+encodeURIComponent(total.toFixed(2))+'&cu=INR';
 modal('EMI Payment',`<div>
  <p><b>Customer:</b> ${esc((window.cache?.customers||[]).find(c=>String(c.id)===String(x.customer_id))?.full_name||'Customer')}</p>
  <p><b>Loan ID:</b> ${esc(x.loan_id)} &nbsp; <b>EMI:</b> ${esc(x.emi_number)}</p>
  <div style="font-size:30px;font-weight:800;color:#0754b8;margin:14px 0">${money(total)}</div>
  <p><b>Payment Method</b></p>
  <select id="staffPayMethod" style="padding:10px;border:1px solid #ccd5e0;border-radius:7px;width:100%;max-width:420px">
   <option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option>
  </select>
  <div id="staffUpiBox" style="text-align:center;margin-top:15px">
   <p>UPI ID: <b>${UPI}</b></p><canvas id="staffPayQr" width="210" height="210"></canvas><br>
   <button id="staffPayUpi" class="btn green">Pay Now with UPI</button>
  </div>
  <label style="display:block;margin-top:14px;font-weight:700">Reference / Remarks<input id="staffPayRef" placeholder="Optional reference number or remark" style="display:block;width:100%;padding:10px;margin-top:5px;border:1px solid #ccd5e0;border-radius:7px"></label>
  <p style="margin-top:15px;color:#667085;font-size:13px">After receiving/confirming the payment, click Confirm Payment. This records the payment and updates the EMI.</p>
  <button id="staffConfirmPay" class="btn green" style="margin-top:8px">Confirm Payment Received</button>
 </div>`);
 const c=document.getElementById('staffPayQr');
 if(window.QRCode&&c)QRCode.toCanvas(c,uri,{width:210},()=>{});
 const method=document.getElementById('staffPayMethod');
 const upiBox=document.getElementById('staffUpiBox');
 method.onchange=()=>{upiBox.style.display=method.value==='upi'?'block':'none'};
 document.getElementById('staffPayUpi').onclick=()=>{location.href=uri};
 document.getElementById('staffConfirmPay').onclick=()=>confirmPay(x,total);
}
async function confirmPay(x,total){
 try{
  const method=document.getElementById('staffPayMethod')?.value||'upi';
  const ref=(document.getElementById('staffPayRef')?.value||'').trim();
  if(!window.supabase||!window.HFY_SUPABASE_URL||!window.HFY_SUPABASE_PUBLISHABLE_KEY)throw new Error('Payment connection unavailable');
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const loan=(window.cache?.loans||[]).find(l=>String(l.id)===String(x.loan_account_id)||String(l.loan_id)===String(x.loan_id));
  if(!loan?.id)throw new Error('Loan account not found');
  const r=await sb.rpc('hfy_record_payment',{p_loan_account_id:loan.id,p_amount:total,p_payment_date:new Date().toISOString().slice(0,10),p_payment_type:'emi',p_remarks:ref||method});
  if(r.error)throw r.error;
  const tx=r.data?.transaction_id;
  if(tx){
   const u=await sb.from('financial_transactions').update({payment_method:method,reference_number:ref||null,notes:ref||null}).eq('transaction_id',tx);
   if(u.error)throw u.error;
  }
  document.getElementById('staffPayModal').style.display='none';
  if(typeof window.load==='function')await window.load();
  alert('EMI payment successful.');
 }catch(err){console.error(err);alert('EMI payment failed: '+(err?.message||err))}
}
window.staffOpenEmiPayment=openPay;
window.staffConfirmEmiPay=confirmPay;
function customerName(id){const c=(window.cache?.customers||[]).find(x=>String(x.id)===String(id));return c?.full_name||'Customer'}
function viewCustomerEmis(customerId,loanId){
 const rows=(window.cache?.emis||[]).filter(e=>String(e.customer_id)===String(customerId)&&(!loanId||String(e.loan_account_id||e.loan_id)===String(loanId)));
 const c=(window.cache?.customers||[]).find(x=>String(x.id)===String(customerId));
 const loan=(window.cache?.loans||[]).find(x=>String(x.id)===String(loanId)||String(x.loan_id)===String(loanId));
 let total=0,paid=0,penalty=0;rows.forEach(e=>{total+=Number(e.total_due||0);paid+=Number(e.paid_amount||0);penalty+=Number(e.penalty||0)});
 modal('Full EMI List',`<p><b>Name:</b> ${esc(c?.full_name||customerName(customerId))} &nbsp; <b>Loan ID:</b> ${esc(loan?.loan_id||loanId||'')} &nbsp; <b>Mobile:</b> ${esc(c?.mobile||'')} &nbsp; <b>Sanction Loan:</b> ${money(loan?.loan_amount||0)} &nbsp; <b>Total Loan:</b> ${money(loan?.total_repayment||0)}</p><div class="wrap"><table><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(e=>{const rem=Number(e.remaining_amount??Math.max(Number(e.total_due||0)-Number(e.paid_amount||0),0));const st=String(e.status||'pending').toLowerCase();return `<tr><td>${esc(e.emi_number)}</td><td>${dt(e.due_date)}</td><td>${money(e.emi_amount)}</td><td>${money(e.penalty)}</td><td>${money(e.total_due)}</td><td>${money(e.paid_amount)}</td><td>${money(rem)}</td><td>${esc(st)}</td><td>${rem>0?`<button class="btn green" onclick="staffOpenEmiPayment(window.cache.emis.find(z=>String(z.id)===String('${esc(e.id)}')))" >Pay Now</button>`:'<b class="paid">Paid</b>'}</td></tr>`}).join('')}</tbody></table></div><p><b>Total EMI:</b> ${rows.length} &nbsp; <b>Total Paid:</b> ${money(paid)} &nbsp; <b>Remaining:</b> ${money(Math.max(total-paid,0))} &nbsp; <b>Penalty:</b> ${money(penalty)} &nbsp; <b>Total Due:</b> ${money(total)}</p>`)
}
window.viewCustomerEmis=viewCustomerEmis;
window.renderEmi=function(){
 const rows=window.cache?.emis||[];const groups={};rows.forEach(e=>{const key=String(e.customer_id)+'|'+String(e.loan_account_id||e.loan_id);(groups[key]??=[]).push(e)});
 const out=Object.values(groups).map(g=>{const e=g[0],c=(window.cache.customers||[]).find(x=>String(x.id)===String(e.customer_id)),loan=(window.cache.loans||[]).find(x=>String(x.id)===String(e.loan_account_id)||String(x.id)===String(e.loan_id)||String(x.loan_id)===String(e.loan_id));const sanction=Number(loan?.loan_amount||0),totalLoan=Number(loan?.total_repayment||g.reduce((s,x)=>s+Number(x.total_due||0),0)),over=g.filter(x=>x.status==='overdue').reduce((s,x)=>s+Number(x.remaining_amount||0),0),remaining=g.reduce((s,x)=>s+Number(x.remaining_amount||0),0),status=remaining<=0?'paid':g.some(x=>x.status==='overdue')?'overdue':'pending';return `<tr><td>${esc(c?.full_name||'Customer')}</td><td>${esc(loan?.loan_id||e.loan_id||'')}</td><td>${esc(c?.mobile||'')}</td><td>${money(sanction)}</td><td>${money(totalLoan)}</td><td>${dt(loan?.start_date||e.due_date)}</td><td>${money(over)}</td><td class="${status==='paid'?'paid':status==='overdue'?'over':'pending'}">${status}</td><td><button class="btn blue" onclick="viewCustomerEmis('${esc(e.customer_id)}','${esc(e.loan_account_id||e.loan_id)}')">View</button></td></tr>`}).join('');document.getElementById('emiRows').innerHTML=out||'<tr><td colspan="9">No EMI records</td></tr>';
};
setTimeout(()=>{if(typeof window.renderEmi==='function')window.renderEmi()},100);
setInterval(()=>{if(document.getElementById('emi')?.classList.contains('on')&&typeof window.renderEmi==='function')window.renderEmi()},1500);
})();
