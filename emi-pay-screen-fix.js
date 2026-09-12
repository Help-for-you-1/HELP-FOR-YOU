(()=>{
'use strict';
const sbPayFix=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const escPayFix=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyPayFix=v=>'₹'+Number(v||0).toFixed(2);
window.hfyPay=async function(id){
 try{
  if(!id)return alert('EMI not found.');
  const sb=sbPayFix();
  const q=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(q.error)throw q.error;
  const e=q.data;if(!e)return alert('EMI not found.');
  const total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0));
  const remaining=Math.max(0,total-Number(e.paid_amount||0));
  if(remaining<=0||String(e.status||'').toLowerCase()==='paid')return alert('This EMI is already paid.');
  let customer='-';
  if(e.customer_id){const c=await sb.from('customers').select('full_name,mobile').eq('id',e.customer_id).maybeSingle();if(c.error)throw c.error;customer=c.data?.full_name||'-';}
  window.__hfyPaymentEmi=e;
  window.openBox('UPI Payment',`<div class="form"><div class="full"><b>Customer:</b> ${escPayFix(customer)} &nbsp; <b>EMI:</b> ${escPayFix(e.emi_number)}</div><div class="full"><b>Remaining Amount:</b> ${moneyPayFix(remaining)}</div><label>Payment Method<select id="hfyPaymentType"><option value="upi" selected>UPI</option></select></label><label>Amount<input id="hfyPaymentAmount" type="number" min="1" step="0.01" value="${remaining.toFixed(2)}"></label><div class="full"><p><b>UPI ID:</b> Q526188998@ybl</p><button class="btn green" onclick="hfyStartUPIPayment()">Pay Now with UPI</button></div></div>`);
 }catch(e){console.error(e);alert('Payment screen error: '+(e?.message||e));}
};
})();
