(()=>{
'use strict';
const sbStaffPay=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const escStaffPay=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyStaffPay=v=>'₹'+Number(v||0).toFixed(2);
window.staffOpenPayment=async function(emiId){
 try{
  const sb=sbStaffPay();
  const q=await sb.from('loan_emi_schedule').select('*').eq('id',emiId).maybeSingle();
  if(q.error)throw q.error;
  const e=q.data;if(!e)return alert('EMI not found.');
  const total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0));
  const paid=Number(e.paid_amount||0);const remaining=Math.max(0,total-paid);
  if(remaining<=0)return alert('This EMI is already paid.');
  const c=await sb.from('customers').select('full_name,mobile').eq('id',e.customer_id).maybeSingle();
  if(c.error)throw c.error;
  window.__staffPaymentEmi=e;
  window.openBox('Pay EMI',`<div class="form"><div class="full"><b>Customer:</b> ${escStaffPay(c.data?.full_name||'-')} &nbsp; <b>Mobile:</b> ${escStaffPay(c.data?.mobile||'-')}</div><div class="full"><b>EMI:</b> ${escStaffPay(e.emi_number)} &nbsp; <b>Due Date:</b> ${escStaffPay(e.due_date)} &nbsp; <b>Remaining:</b> ${moneyStaffPay(remaining)}</div><label>Payment Method<select id="staffPaymentType"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option></select></label><label>Amount<input id="staffPaymentAmount" type="number" min="1" step="0.01" value="${remaining.toFixed(2)}"></label><label class="full">Reference / Remarks<textarea id="staffPaymentRemarks" rows="3" placeholder="Optional"></textarea></label><div class="full"><button class="btn gray" onclick="closeM()">Cancel</button><button id="staffConfirmPayment" class="btn green" onclick="staffConfirmPayment()">Pay Now</button></div></div>`);
 }catch(err){console.error(err);alert('Payment screen error: '+(err?.message||err));}
};
window.staffConfirmPayment=async function(){
 const e=window.__staffPaymentEmi;if(!e)return;
 const amount=Number(document.getElementById('staffPaymentAmount')?.value||0);
 const total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0));
 const remaining=Math.max(0,total-Number(e.paid_amount||0));
 if(amount<=0)return alert('Enter a valid payment amount.');
 if(amount>remaining)return alert('Payment amount cannot exceed EMI remaining amount.');
 const btn=document.getElementById('staffConfirmPayment');if(btn){btn.disabled=true;btn.textContent='Processing...';}
 try{
  const r=await sbStaffPay().rpc('hfy_record_payment',{p_loan_account_id:e.loan_account_id,p_amount:amount,p_payment_date:new Date().toISOString().slice(0,10),p_payment_type:document.getElementById('staffPaymentType')?.value||'upi',p_remarks:document.getElementById('staffPaymentRemarks')?.value.trim()||null});
  if(r.error)throw r.error;
  if(!r.data?.success)throw new Error('Payment failed');
  window.__staffPaymentEmi=null;closeM();if(typeof window.loadData==='function')await window.loadData();alert('Payment successful. Transaction: '+(r.data.transaction_id||'—'));
 }catch(err){console.error(err);alert('Payment error: '+(err?.message||err));}
 finally{if(btn){btn.disabled=false;btn.textContent='Pay Now';}}
};
window.emi30Paid=window.staffOpenPayment;
})();
