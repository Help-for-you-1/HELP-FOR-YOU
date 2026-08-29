/* HELP FOR YOU — STAFF EMI PAYMENT ONLY. Pay Now uses the same payment flow as Customer Portal. */
(function(){
'use strict';
function money(v){return '₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2})}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function modal(html){
 let m=document.getElementById('staffPayModal');
 if(!m){
  m=document.createElement('div');m.id='staffPayModal';
  m.style='position:fixed;inset:0;background:#0008;display:none;align-items:center;justify-content:center;padding:18px;z-index:9999';
  m.innerHTML='<div style="background:#fff;border-radius:14px;padding:22px;width:min(460px,100%);max-height:92vh;overflow:auto"><div id="staffPayBody"></div></div>';
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
})();
