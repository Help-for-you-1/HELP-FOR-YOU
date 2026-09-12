(()=>{
'use strict';
const sb=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const oldEditCustomer=window.editCustomer;
if(typeof oldEditCustomer==='function'){
  window.editCustomer=async function(displayIndex){
    try{
      const q=await sb().from('customers').select('*').order('created_at',{ascending:false});
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

let installed=false;
function installSchemaSafeSaves(){
  if(installed || typeof window.saveCustomerFull!=='function')return;
  installed=true;
  // Keep the existing save handlers installed by the other admin scripts unchanged.
}
setInterval(installSchemaSafeSaves,250);
setTimeout(installSchemaSafeSaves,2000);

// Application ID display fix only. Existing Customer columns, buttons and actions remain unchanged.
async function addCustomerApplicationIds(){
  try{
    const rows=document.getElementById('cuRows');
    if(!rows)return;
    const table=rows.closest('table');
    const head=table?.querySelector('tr');
    if(!head)return;

    if(!head.querySelector('[data-hfy-app-id]')){
      const th=document.createElement('th');
      th.textContent='Application ID';
      th.setAttribute('data-hfy-app-id','1');
      head.insertBefore(th,head.children[2]||null);
    }

    const q=await sb().from('loan_applications').select('id,application_id,customer_id');
    if(q.error)throw q.error;
    const apps=q.data||[];

    // Customer rows are already filtered/sorted by the existing admin renderer.
    const customerQ=await sb().from('customers').select('id,full_name,mobile').order('created_at',{ascending:false});
    if(customerQ.error)throw customerQ.error;
    const term=(document.getElementById('search')?.value||'').toLowerCase();
    const visible=(customerQ.data||[]).filter(x=>(String(x.full_name||'')+' '+String(x.mobile||'')).toLowerCase().includes(term));

    Array.from(rows.querySelectorAll('tr')).forEach((tr,index)=>{
      if(!tr.children.length || tr.querySelector('[data-hfy-app-id]'))return;
      const customer=visible[index];
      const app=customer ? apps.find(a=>String(a.customer_id)===String(customer.id)) : null;
      const td=document.createElement('td');
      td.textContent=app?.application_id || app?.id || '-';
      td.setAttribute('data-hfy-app-id','1');
      tr.insertBefore(td,tr.children[2]||null);
    });
  }catch(e){console.error('Application ID display fix:',e);}
}

const oldRender=window.render;
if(typeof oldRender==='function'){
  window.render=function(){
    oldRender();
    setTimeout(addCustomerApplicationIds,0);
  };
}
})();