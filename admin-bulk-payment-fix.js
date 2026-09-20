(()=>{
'use strict';
const sbBulk=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const moneyBulk=v=>'₹'+Number(v||0).toFixed(2);
window.hfyAdminBulkPayment=async function(emiId){
  if(!emiId)return alert('EMI not found.');
  const amount=Number(document.getElementById('hfyBulkAmount')?.value||0);
  if(!Number.isFinite(amount)||amount<=0)return alert('Enter a valid bulk payment amount.');
  const date=document.getElementById('hfyBulkDate')?.value||new Date().toISOString().slice(0,10);
  if(!confirm('Confirm bulk payment of '+moneyBulk(amount)+'? This will allocate the amount to unpaid EMIs in due-date order.'))return;
  try{
    const sb=sbBulk();
    const r=await sb.rpc('hfy_admin_bulk_payment',{p_emi_id:emiId,p_amount:amount,p_payment_date:date,p_payment_type:'EMI Payment',p_transaction_id:null,p_remarks:'Admin bulk EMI payment'});
    if(r.error)throw r.error;
    if(!r.data?.success)throw new Error('Bulk payment was not completed.');
    const allocated=Number(r.data.allocated_amount||0),unallocated=Number(r.data.unallocated_amount||0),count=Array.isArray(r.data.emi_ids)?r.data.emi_ids.length:0;
    if(typeof window.closeM==='function')window.closeM();
    if(typeof window.loadData==='function')await window.loadData();
    if(typeof window.loadEMI==='function')await window.loadEMI();
    if(typeof window.render==='function')await window.render();
    alert('Bulk payment recorded successfully. '+count+' EMI(s) updated. Allocated: '+moneyBulk(allocated)+(unallocated>0?' | Unallocated: '+moneyBulk(unallocated):''));
  }catch(e){console.error(e);alert('Bulk payment failed: '+(e?.message||e));}
};
function addBulkButton(){
  const mb=document.getElementById('mb'),mt=document.getElementById('mt');
  if(!mb||!mt||mt.textContent.trim()!=='Full EMI List'||document.getElementById('hfyBulkBox'))return;
  const table=mb.querySelector('table'); if(!table)return;
  const first=table.querySelector('tbody tr');
  const payBtn=first?.querySelector('button[onclick*="hfyPay"]');
  const onclick=payBtn?.getAttribute('onclick')||'';
  const m=onclick.match(/hfyPay\(\s*['"]([^'"]+)['"]\s*\)/i);
  const emiId=m?.[1];
  if(!emiId)return;
  const box=document.createElement('div'); box.id='hfyBulkBox'; box.className='full';
  box.style='margin:12px 0;padding:12px;border:1px solid #d7e0ea;border-radius:10px;background:#f7f9fc';
  box.innerHTML='<b>Bulk Payment</b><div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-top:8px;align-items:end"><label style="font-size:12px;font-weight:700">Amount<input id="hfyBulkAmount" type="number" min="0.01" step="0.01" placeholder="e.g. 2000" style="width:100%;margin-top:5px;padding:9px;border:1px solid #ccd5e0;border-radius:7px"></label><label style="font-size:12px;font-weight:700">Payment Date<input id="hfyBulkDate" type="date" value="'+new Date().toISOString().slice(0,10)+'" style="width:100%;margin-top:5px;padding:9px;border:1px solid #ccd5e0;border-radius:7px"></label><button class="btn blue" type="button" onclick="hfyAdminBulkPayment(\''+emiId+'\')">Bulk Pay</button></div><small style="display:block;margin-top:7px;color:#586579">Amount is allocated to unpaid EMIs from the oldest due date first. Pay Now is unchanged.</small>';
  const heading=mb.querySelector('p'); if(heading)heading.insertAdjacentElement('afterend',box); else mb.prepend(box);
}
const mo=new MutationObserver(addBulkButton);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}));else mo.observe(document.body,{childList:true,subtree:true});
window.addEventListener('load',addBulkButton);
})();