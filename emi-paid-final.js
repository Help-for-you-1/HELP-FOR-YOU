(()=>{
'use strict';
async function hfyAmountPay(id){
 try{
  if(!id)return alert('EMI not found.');
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const one=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(one.error)throw one.error;
  if(!one.data)return alert('EMI not found.');
  if(String(one.data.status||'').toLowerCase()==='paid')return alert('This EMI is already paid.');
  const raw=prompt('Enter payment amount',Number(one.data.remaining_amount||one.data.total_due||one.data.emi_amount||0).toFixed(2));
  if(raw===null)return;
  const amount=Number(String(raw).replace(/,/g,''));
  if(!Number.isFinite(amount)||amount<=0)return alert('Please enter a valid payment amount.');
  const all=await sb.from('loan_emi_schedule').select('*').eq('loan_account_id',one.data.loan_account_id).order('emi_number',{ascending:true});
  if(all.error)throw all.error;
  const unpaid=(all.data||[]).filter(e=>String(e.status||'').toLowerCase()!=='paid'&&Math.max(0,Number(e.remaining_amount??(Number(e.total_due||0)-Number(e.paid_amount||0))||e.emi_amount||0))>0);
  let left=amount,covered=[];
  for(const e of unpaid){
   const due=Math.max(0,Number(e.remaining_amount??(Number(e.total_due||0)-Number(e.paid_amount||0))||e.emi_amount||0));
   if(left+0.000001>=due){covered.push(e);left=Number((left-due).toFixed(2));}else break;
  }
  if(!covered.length){
   const e=unpaid[0],due=Math.max(0,Number(e.remaining_amount??(Number(e.total_due||0)-Number(e.paid_amount||0))||e.emi_amount||0));
   const paid=Number(amount.toFixed(2)),rem=Number(Math.max(0,due-paid).toFixed(2));
   const u=await sb.from('loan_emi_schedule').update({paid_amount:paid,remaining_amount:rem,status:rem<=0?'paid':'pending'}).eq('id',e.id);
   if(u.error)throw u.error;
  }else{
   for(let i=0;i<covered.length;i++){
    const u=await sb.from('loan_emi_schedule').update({paid_amount:i===0?Number(amount.toFixed(2)):0,remaining_amount:0,status:'paid'}).eq('id',covered[i].id);
    if(u.error)throw u.error;
   }
  }
  if(typeof window.closeM==='function')window.closeM();
  if(typeof window.loadData==='function')await window.loadData();
  if(typeof window.loadEMI==='function')await window.loadEMI();
  if(typeof window.render==='function')await window.render();
  alert('Payment recorded successfully.');
 }catch(e){console.error(e);alert('Payment update failed: '+(e?.message||e));}
}
window.hfyPay=hfyAmountPay;window.emiFinalPaid=hfyAmountPay;window.emi30Paid=hfyAmountPay;window.paid=hfyAmountPay;
window.hfyMarkEmiUnpaid=async function(id){
 if(!confirm('Are you sure you want to mark this EMI as Unpaid? Any recorded payment linked to this EMI will be reversed.'))return;
 try{const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);const r=await sb.rpc('hfy_mark_emi_unpaid',{p_emi_id:id});if(r.error)throw r.error;if(typeof window.closeM==='function')window.closeM();if(typeof window.loadData==='function')await window.loadData();alert('EMI marked as Unpaid successfully.')}catch(e){console.error(e);alert('Mark Unpaid error: '+(e?.message||e));}
};
setTimeout(()=>{window.hfyPay=hfyAmountPay;window.emiFinalPaid=hfyAmountPay;window.emi30Paid=hfyAmountPay;window.paid=hfyAmountPay;},0);
})();