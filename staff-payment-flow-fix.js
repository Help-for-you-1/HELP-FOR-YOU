(()=>{
'use strict';
const sbStaffPay=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const escStaffPay=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyStaffPay=v=>'₹'+Number(v||0).toFixed(2);
window.staffOpenPayment=async function(emiId){
 try{
  const sb=sbStaffPay();const q=await sb.from('loan_emi_schedule').select('*').eq('id',emiId).maybeSingle();
  if(q.error)throw q.error;const e=q.data;if(!e)return alert('EMI not found.');
  const total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0)),paid=Number(e.paid_amount||0),remaining=Math.max(0,total-paid);
  if(remaining<=0)return alert('This EMI is already paid.');
  const c=await sb.from('customers').select('full_name,mobile').eq('id',e.customer_id).maybeSingle();if(c.error)throw c.error;
  window.__staffPaymentEmi=e;
  window.openBox('UPI Payment',`<div class="form"><div class="full"><b>Customer:</b> ${escStaffPay(c.data?.full_name||'-')} &nbsp; <b>Mobile:</b> ${escStaffPay(c.data?.mobile||'-')}</div><div class="full"><b>EMI:</b> ${escStaffPay(e.emi_number)} &nbsp; <b>Remaining:</b> ${moneyStaffPay(remaining)}</div><label>Payment Method<select id="staffPaymentType"><option value="upi" selected>UPI</option></select></label><label>Amount<input id="staffPaymentAmount" type="number" min="1" step="0.01" value="${remaining.toFixed(2)}"></label><div class="full"><p><b>UPI ID:</b> Q526188998@ybl</p><button class="btn green" onclick="staffStartUPIPayment()">Pay Now with UPI</button></div></div>`);
 }catch(err){console.error(err);alert('Payment screen error: '+(err?.message||err));}
};
window.staffStartUPIPayment=function(){
 const e=window.__staffPaymentEmi;if(!e)return;
 const amount=Number(document.getElementById('staffPaymentAmount')?.value||0),total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0)),remaining=Math.max(0,total-Number(e.paid_amount||0));
 if(amount<=0||amount>remaining)return alert('Enter a valid payment amount.');
 const upi='upi://pay?pa=Q526188998@ybl&pn=HELP%20FOR%20YOU&am='+encodeURIComponent(amount.toFixed(2))+'&cu=INR&tn='+encodeURIComponent('EMI '+(e.emi_number||''));
 window.location.href=upi;
};
window.staffConfirmPayment=async function(){alert('Payment is not marked Paid automatically. Admin must verify receipt and mark the EMI as Paid.');};
window.emi30Paid=window.staffOpenPayment;
})();
