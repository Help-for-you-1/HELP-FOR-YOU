(()=>{
'use strict';
window.hfyPay=async function(id){
 try{
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const q=await sb.from('loan_emi_schedule').select('id,emi_amount,penalty,paid_amount,status').eq('id',id).single();
  if(q.error) throw q.error;
  const e=q.data;
  if(String(e.status||'').toLowerCase()==='paid'){alert('This EMI is already paid.');return;}
  const total=Number(e.emi_amount||0)+Number(e.penalty||0);
  const u=await sb.from('loan_emi_schedule').update({paid_amount:total,status:'paid'}).eq('id',id);
  if(u.error) throw u.error;
  if(typeof window.closeM==='function') window.closeM();
  if(typeof window.loadData==='function') await window.loadData();
  alert('EMI marked as Paid successfully.');
 }catch(e){console.error(e);alert('EMI Payment error: '+(e?.message||e));}
};
window.emiFinalPaid=window.hfyPay;
window.paid=window.hfyPay;
})();
