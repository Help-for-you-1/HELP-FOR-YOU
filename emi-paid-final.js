(()=>{
'use strict';
window.hfyPay=async function(id){
 try{
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const r=await sb.rpc('hfy_mark_emi_paid',{p_emi_id:id});
  if(r.error) throw r.error;
  if(typeof window.closeM==='function') window.closeM();
  if(typeof window.loadData==='function') await window.loadData();
  alert(r.data?.already_paid?'This EMI is already paid.':'EMI marked as Paid successfully.');
 }catch(e){console.error(e);alert('EMI Payment error: '+(e?.message||e));}
};
window.emiFinalPaid=window.hfyPay;
window.emi30Paid=window.hfyPay;
window.paid=window.hfyPay;
})();
