(()=>{
'use strict';
const sbPay=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const escPay=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyPay=v=>'₹'+Number(v||0).toFixed(2);
async function hfyAmountPay(id){
 try{
  if(!id)return alert('EMI not found.');
  const sb=sbPay();
  const q=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(q.error)throw q.error;
  const e=q.data;if(!e)return alert('EMI not found.');
  const total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0));
  const remaining=Math.max(0,total-Number(e.paid_amount||0));
  if(remaining<=0||String(e.status||'').toLowerCase()==='paid')return alert('This EMI is already paid.');
  let customer='-';
  if(e.customer_id){const c=await sb.from('customers').select('full_name,mobile').eq('id',e.customer_id).maybeSingle();if(c.error)throw c.error;customer=c.data?.full_name||'-';}
  window.__hfyPaymentEmi=e;
  window.openBox('UPI Payment',`<div class="form"><div class="full"><b>Customer:</b> ${escPay(customer)} &nbsp; <b>EMI:</b> ${escPay(e.emi_number)}</div><div class="full"><b>Remaining Amount:</b> ${moneyPay(remaining)}</div><label>Payment Method<select id="hfyPaymentType"><option value="upi" selected>UPI</option></select></label><label>Amount<input id="hfyPaymentAmount" type="number" min="1" step="0.01" value="${remaining.toFixed(2)}"></label><div class="full"><p><b>UPI ID:</b> Q526188998@ybl</p><button class="btn green" onclick="hfyStartUPIPayment()">Pay Now with UPI</button></div></div>`);
 }catch(e){console.error(e);alert('Payment screen error: '+(e?.message||e));}
}
window.hfyStartUPIPayment=function(){
 const e=window.__hfyPaymentEmi;if(!e)return;
 const amount=Number(document.getElementById('hfyPaymentAmount')?.value||0);
 const total=Number(e.total_due||Number(e.emi_amount||0)+Number(e.penalty||0));
 const remaining=Math.max(0,total-Number(e.paid_amount||0));
 if(!Number.isFinite(amount)||amount<=0||amount>remaining)return alert('Enter a valid payment amount.');
 const upi='upi://pay?pa=Q526188998@ybl&pn=HELP%20FOR%20YOU&am='+encodeURIComponent(amount.toFixed(2))+'&cu=INR&tn='+encodeURIComponent('EMI '+(e.emi_number||''));
 window.location.href=upi;
};
window.staffConfirmPayment=window.staffConfirmPayment||function(){alert('Payment is not marked Paid automatically. Admin must verify receipt and mark the EMI as Paid.');};
window.hfyPay=hfyAmountPay;window.emiFinalPaid=hfyAmountPay;window.emi30Paid=hfyAmountPay;window.paid=hfyAmountPay;
window.hfyMarkEmiUnpaid=async function(id){
 if(!id)return alert('EMI not found.');
 if(!confirm('Are you sure you want to mark this EMI as Unpaid? Any recorded payment linked to this EMI will be reversed.'))return;
 try{
  const sb=sbPay();
  const r=await sb.rpc('hfy_mark_emi_unpaid',{p_emi_id:id});
  if(r.error)throw r.error;
  if(!r.data?.success)throw new Error('Mark Unpaid was not completed.');
  if(typeof window.closeM==='function')window.closeM();
  if(typeof window.loadData==='function')await window.loadData();
  if(typeof window.loadEMI==='function')await window.loadEMI();
  if(typeof window.render==='function')await window.render();
  alert('EMI marked as Unpaid successfully.');
 }catch(e){console.error(e);alert('Mark Unpaid error: '+(e?.message||e));}
};
})();