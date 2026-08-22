(()=>{
'use strict';
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
window.emi30Paid=async function(id){
 try{
  const sb=db();
  const q=await sb.from('loan_emi_schedule').select('*').eq('id',id).single();
  if(q.error) throw q.error;
  const e=q.data;
  const total=Number(e.emi_amount||0)+Number(e.penalty||0);
  const u=await sb.from('loan_emi_schedule').update({paid_amount:total,remaining_amount:0,status:'paid'}).eq('id',id);
  if(u.error) throw u.error;
  if(typeof window.closeM==='function') window.closeM();
  if(typeof window.loadData==='function') await window.loadData();
  if(typeof window.show==='function') window.show('repay',document.querySelector('.m[onclick*=\"repay\"]'));
  alert('EMI marked as Paid successfully.');
 }catch(err){ console.error(err); alert('EMI Payment error: '+(err?.message||err)); }
};
})();
