(()=>{
'use strict';
const oldEditCustomer=window.editCustomer;
if(typeof oldEditCustomer==='function'){
  window.editCustomer=async function(displayIndex){
    try{
      const sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
      const q=await sb.from('customers').select('*').order('created_at',{ascending:false});
      if(q.error)throw q.error;
      const term=(document.getElementById('search')?.value||'').toLowerCase();
      const visible=(q.data||[]).filter(x=>(String(x.full_name||'')+' '+String(x.mobile||'')).toLowerCase().includes(term));
      const customer=visible[Number(displayIndex)];
      if(!customer)return alert('Customer not found.');
      const actualIndex=(q.data||[]).findIndex(x=>String(x.id)===String(customer.id));
      if(actualIndex<0)return alert('Customer not found.');
      return oldEditCustomer(actualIndex);
    }catch(e){console.error(e);alert('Customer edit error: '+(e?.message||e));}
  };
}
})();
