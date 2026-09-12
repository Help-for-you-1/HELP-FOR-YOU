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
  window.openBox('Payment',`<div class="form"><div class="full"><b>Customer:</b> ${escPayFix(customer)} &nbsp; <b>EMI:</b> ${escPayFix(e.emi_number)}</div><div class="full"><b>Current EMI Remaining:</b> ${moneyPayFix(remaining)}</div><label>Payment Method<select id="hfyPaymentType" onchange="hfyPaymentMethodChanged()"><option value="upi" selected>UPI</option><option value="cash">Cash (Admin)</option></select></label><label>Amount<input id="hfyPaymentAmount" type="number" min="${remaining.toFixed(2)}" step="0.01" value="${remaining.toFixed(2)}"></label><div id="hfyUpiPaymentBox" class="full"><p><b>UPI ID:</b> Q526188998@ybl</p><button class="btn green" onclick="hfyStartUPIPayment()">Pay Now with UPI</button></div><div id="hfyCashPaymentBox" class="full" style="display:none"><p><b>Cash payment is available only to Admin.</b></p><button class="btn green" onclick="hfyConfirmCashPayment()">Confirm Cash Payment</button></div></div>`);
 }catch(e){console.error(e);alert('Payment screen error: '+(e?.message||e));}
};
window.hfyPaymentMethodChanged=function(){
 const type=document.getElementById('hfyPaymentType')?.value;
 const upi=document.getElementById('hfyUpiPaymentBox');
 const cash=document.getElementById('hfyCashPaymentBox');
 if(upi)upi.style.display=type==='upi'?'block':'none';
 if(cash)cash.style.display=type==='cash'?'block':'none';
};
window.hfyConfirmCashPayment=async function(){
 const e=window.__hfyPaymentEmi;if(!e)return;
 const amount=Number(document.getElementById('hfyPaymentAmount')?.value||0);
 const currentTotal=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0));
 const currentRemaining=Math.max(0,currentTotal-Number(e.paid_amount||0));
 if(!Number.isFinite(amount)||amount<currentRemaining)return alert('Amount must be at least the current EMI remaining amount.');
 if(!confirm('Confirm this Cash payment? The amount will be allocated to the EMI schedule automatically.'))return;
 try{
  const sb=sbPayFix();
  const r=await sb.rpc('hfy_add_payment',{p_emi_id:e.id,p_amount:amount,p_payment_date:new Date().toISOString().slice(0,10),p_payment_type:'Cash',p_remarks:'Cash payment by Admin',p_transaction_id:null});
  if(r.error)throw r.error;
  if(!r.data?.success)throw new Error('Cash payment was not completed.');
  if(typeof window.closeM==='function')window.closeM();
  if(typeof window.loadData==='function')await window.loadData();
  if(typeof window.loadEMI==='function')await window.loadEMI();
  if(typeof window.render==='function')await window.render();
  alert('Cash payment recorded successfully.');
 }catch(err){console.error(err);alert('Cash payment error: '+(err?.message||err));}
};
})();
