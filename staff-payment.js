/* HELP FOR YOU — STAFF EMI PAYMENT + GROUPED EMI LIST. */
(function(){
'use strict';
function money(v){return '₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2})}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function date(v){return v?new Date(v).toLocaleDateString('en-IN'):''}
function modal(html){
 let m=document.getElementById('staffPayModal');
 if(!m){
  m=document.createElement('div');m.id='staffPayModal';
  m.style='position:fixed;inset:0;background:#0008;display:none;align-items:center;justify-content:center;padding:18px;z-index:9999';
  m.innerHTML='<div style="background:#fff;border-radius:14px;padding:22px;width:min(700px,100%);max-height:92vh;overflow:auto"><div id="staffPayBody"></div></div>';
  document.body.appendChild(m);
 }
 document.getElementById('staffPayBody').innerHTML=html;m.style.display='flex';
}
function closeModal(){const m=document.getElementById('staffPayModal');if(m)m.style.display='none'}
function openPay(emi){
 if(!emi||!emi.loan_account_id){alert('Loan account not found');return}
 const total=Number(emi.total_due||Number(emi.emi_amount||0)+Number(emi.penalty||0));
 const paid=Number(emi.paid_amount||0);const remaining=Math.max(0,total-paid);
 if(remaining<=0){alert('This EMI is already paid.');return}
 modal(`<h2>Pay EMI</h2><div style="color:#667085;font-size:13px;margin-bottom:12px">EMI ${esc(emi.emi_number)} • Due ${esc(emi.due_date)} • Remaining ${money(remaining)}</div><label>Payment Method</label><select id="staffPaymentType" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #d9dee7;border-radius:8px"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option></select><label>Amount</label><input id="staffPaymentAmount" type="number" min="1" max="${remaining}" step="0.01" value="${remaining.toFixed(2)}" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #d9dee7;border-radius:8px"><label>Reference / Remarks</label><textarea id="staffPaymentRemarks" rows="3" placeholder="Optional" style="width:100%;padding:10px;margin:6px 0 12px;border:1px solid #d9dee7;border-radius:8px"></textarea><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn gray" id="staffCancelPay">Cancel</button><button class="btn green" id="staffConfirmPay">Pay Now</button></div>`);
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
  closeModal();alert('Payment successful. Transaction: '+(data.transaction_id||'—'));
  if(typeof window.load==='function')await window.load();
 }catch(e){alert(e.message||String(e))}finally{btn.disabled=false;btn.textContent='Pay Now'}
}
window.staffOpenEmiPayment=openPay;
window.staffConfirmEmiPay=submitPay;

/* Staff EMI section: one row per loan, with all EMIs inside View. */
function setupEmiList(){
 const table=document.querySelector('#emi .wrap table');
 if(!table)return;
 const head=table.querySelector('thead tr');
 if(head)head.innerHTML='<th>Loan ID</th><th>Name</th><th>Mobile Number</th><th>Due Amount</th><th>Due Date</th><th>Action</th>';
 window.renderEmi=function(){
  const tbody=document.getElementById('emiRows'); if(!tbody)return;
  const emis=(window.cache&&Array.isArray(window.cache.emis))?window.cache.emis:[];
  const customers=(window.cache&&Array.isArray(window.cache.customers))?window.cache.customers:[];
  const groups=new Map();
  emis.forEach(e=>{
   const key=String(e.loan_account_id||e.loan_id||e.customer_id||'unknown');
   if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);
  });
  const rows=[...groups.values()].map(list=>{
   list.sort((a,b)=>new Date(a.due_date||0)-new Date(b.due_date||0));
   const first=list[0];
   const c=customers.find(x=>String(x.id)===String(first.customer_id));
   const name=c?.full_name||'Customer';
   const mobile=c?.mobile||'';
   const pending=list.filter(e=>Number(e.remaining_amount||0)>0);
   const due=pending.reduce((s,e)=>s+Math.max(0,Number(e.total_due||0)-Number(e.paid_amount||0)),0);
   const next=pending[0]||first;
   return `<tr><td>${esc(first.loan_id||first.loan_account_id||'')}</td><td>${esc(name)}</td><td>${esc(mobile)}</td><td>${money(due)}</td><td>${date(next?.due_date)}</td><td><button class="btn" onclick='staffViewLoanEmis(${JSON.stringify(list).replace(/'/g,"&#39;")})'>View</button></td></tr>`;
  });
  tbody.innerHTML=rows.join('')||'<tr><td colspan="6">No EMI records</td></tr>';
 };
 window.staffViewLoanEmis=function(list){
  if(!Array.isArray(list)||!list.length)return;
  const c=(window.cache?.customers||[]).find(x=>String(x.id)===String(list[0].customer_id));
  const name=c?.full_name||'Customer',mobile=c?.mobile||'';
  const rows=list.map((e,i)=>{
   const total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0));
   const remaining=Math.max(0,total-Number(e.paid_amount||0));
   const status=String(e.status||'').toLowerCase();
   const action=remaining>0?`<button class="btn green" onclick="staffOpenEmiPayment(window.cache.emis.find(x=>String(x.id)===String('${esc(e.id)}'))||${JSON.stringify(e).replace(/'/g,"&#39;")})">Pay Now</button>`:'<span class="paid">Paid</span>';
   return `<tr><td>${esc(e.emi_number)}</td><td>${date(e.due_date)}</td><td>${money(e.emi_amount)}</td><td>${money(e.penalty)}</td><td>${money(total)}</td><td>${money(e.paid_amount)}</td><td>${money(remaining)}</td><td class="${status==='paid'?'paid':status==='overdue'?'over':'pending'}">${esc(e.status)}</td><td>${action}</td></tr>`;
  }).join('');
  modal(`<h2>All EMI — ${esc(list[0].loan_id||'')}</h2><div style="margin-bottom:12px;color:#475467"><b>${esc(name)}</b> • ${esc(mobile)}</div><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:760px"><thead><tr><th style="padding:8px">EMI No.</th><th style="padding:8px">Due Date</th><th style="padding:8px">EMI Amount</th><th style="padding:8px">Penalty</th><th style="padding:8px">Total Due</th><th style="padding:8px">Paid</th><th style="padding:8px">Remaining</th><th style="padding:8px">Status</th><th style="padding:8px">Action</th></tr></thead><tbody>${rows}</tbody></table></div><div style="text-align:right;margin-top:14px"><button class="btn gray" onclick="(${closeModal.toString()})()">Close</button></div>`);
 };
 setTimeout(()=>{if(typeof window.renderEmi==='function')window.renderEmi()},0);
}
setupEmiList();
})();
