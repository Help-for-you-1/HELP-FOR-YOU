(()=>{
'use strict';
const renderApplicationIds=async()=>{
  try{
    const rows=document.getElementById('appsRows');
    if(!rows||!window.supabase||!window.HFY_SUPABASE_URL||!window.HFY_SUPABASE_PUBLISHABLE_KEY)return;
    const db=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
    const r=await db.from('loan_applications').select('id,application_id').order('created_at',{ascending:false});
    if(r.error)throw r.error;
    [...rows.querySelectorAll('tr')].forEach((tr,i)=>{
      if(!tr.querySelector('td'))return;
      const app=r.data?.[i];
      const td=document.createElement('td');
      td.textContent=app?.application_id||app?.id||'-';
      tr.insertBefore(td,tr.firstElementChild);
    });
  }catch(e){console.error('Application ID display error:',e)}
};
const observe=()=>{
  const rows=document.getElementById('appsRows');
  if(!rows)return;
  new MutationObserver(()=>setTimeout(renderApplicationIds,0)).observe(rows,{childList:true});
  setTimeout(renderApplicationIds,100);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})();
