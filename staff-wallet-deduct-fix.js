(()=>{
'use strict';
function init(){
  if(!window.supabase||!window.HFY_SUPABASE_URL||!window.HFY_SUPABASE_PUBLISHABLE_KEY)return;
  const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  const add=()=>{
    const mb=document.getElementById('mb');
    if(!mb||mb.dataset.walletDeductReady==='1')return;
    const h=[...mb.querySelectorAll('h2,h3,h4')].find(x=>/Staff Wallet/i.test(x.textContent||''));
    const bonus=[...mb.querySelectorAll('button')].find(x=>/Add Reward|Bonus/i.test(x.textContent||''));
    if(!h||!bonus)return;
    mb.dataset.walletDeductReady='1';
    const b=document.createElement('button');
    b.className='btn red';
    b.textContent='− Deduct Wallet';
    b.type='button';
    b.onclick=async()=>{
      try{
        const idText=mb.innerText.match(/Employee ID:\s*([A-Z0-9-]+)/i);
        if(!idText)throw new Error('Staff Employee ID not found');
        const emp=idText[1];
        const q=await sb.from('staff').select('id').eq('employee_id',emp).maybeSingle();
        if(q.error)throw q.error;
        if(!q.data)throw new Error('Staff record not found');
        const amount=Number(prompt('Enter amount to deduct from wallet:',''));
        if(!Number.isFinite(amount)||amount<=0)return;
        const reason=prompt('Reason / Remarks:','')||null;
        const r=await sb.rpc('hfy_deduct_staff_wallet',{p_staff_id:q.data.id,p_amount:amount,p_remarks:reason});
        if(r.error)throw r.error;
        alert('Wallet deducted successfully.');
        location.reload();
      }catch(e){alert('Wallet deduction failed: '+(e.message||e));}
    };
    bonus.insertAdjacentElement('afterend',b);
  };
  new MutationObserver(add).observe(document.body,{subtree:true,childList:true});
  add();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
