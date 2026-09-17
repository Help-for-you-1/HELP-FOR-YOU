/* HELP FOR YOU — ADMIN EMI PAYMENT FLOW FINAL
   Admin EMI only: Pay Now opens an amount screen first.
   It does NOT mark the EMI paid on button click.
*/
(function(){
'use strict';
function sb(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY)}
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function money(v){return '₹'+Number(v||0).toFixed(2)}
window.hfyAdminPayFinal=async function(id){
 try{
  if(!id)return alert('EMI record not found.');
  const s=sb();
  const q=await s.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(q.error)throw q.error;
  const e=q.data;if(!e)return alert('EMI record not found.');
  const total=Number(e.total_due ?? (Number(e.emi_amount||0)+Number(e.penalty||0)));
  const paid=Number(e.paid_amount||0);
  const remaining=Math.max(0,total-paid);
  if(remaining<=0||String(e.status||'').toLowerCase()==='paid')return alert('This EMI is already paid.');
  let name='-';
  if(e.customer_id){const c=await s.from('customers').select('full_name,mobile').eq('id',e.customer_id).maybeSingle();if(c.error)throw c.error;name=c.data?.full_name||'-';}
  window.__hfyAdminPayFinal={id:e.id,remaining,emi:e};
  openBox('EMI Payment',
   '<div class="form">'+
   '<div class="full"><b>Customer:</b> '+esc(name)+' &nbsp; <b>EMI No.:</b> '+esc(e.emi_number)+'</div>'+ 
   '<div class="full"><b>Amount Due:</b> '+money(remaining)+'</div>'+ 
   '<label class="full">Payment Amount<input id="hfyAdminPayFinalAmount" type="number" min="0.01" step="0.01" value="'+remaining.toFixed(2)+'"></label>'+ 
   '<label>Payment Method<select id="hfyAdminPayFinalMethod"><option value="Cash">Cash</option><option value="UPI">UPI</option></select></label>'+ 
   '<div class="full"><button class="btn green" onclick="hfyAdminConfirmPayFinal()">Confirm Payment</button></div>'+ 
   '</div>'
  );
 }catch(err){console.error(err);alert('Payment screen error: '+(err?.message||err));}
};
window.hfyAdminConfirmPayFinal=async function(){
 const x=window.__hfyAdminPayFinal;if(!x)return alert('Payment screen expired.');
 const input=document.getElementById('hfyAdminPayFinalAmount');
 const method=document.getElementById('hfyAdminPayFinalMethod');
 const amount=Number(input?.value||0);
 if(!Number.isFinite(amount)||amount<=0)return alert('Enter a valid payment amount.');
 if(amount>x.remaining)return alert('Payment amount cannot be greater than this EMI remaining amount.');
 if(!confirm('Confirm payment of '+money(amount)+'?'))return;
 try{
  const s=sb();
  const r=await s.rpc('hfy_add_payment',{p_emi_id:x.id,p_amount:amount,p_payment_date:new Date().toISOString().slice(0,10),p_payment_type:method?.value||'Cash',p_remarks:'Admin EMI payment',p_transaction_id:null});
  if(r.error)throw r.error;
  if(r.data && r.data.success===false)throw new Error(r.data.message||'Payment was not completed.');
  if(typeof closeM==='function')closeM();
  if(typeof loadData==='function')await loadData();
  if(typeof loadEMI==='function')await loadEMI();
  if(typeof render==='function')await render();
  alert('Payment recorded successfully: '+money(amount));
 }catch(err){console.error(err);alert('Payment failed: '+(err?.message||err));}
};
window.hfyPay=window.hfyAdminPayFinal;
})();
