(()=>{
'use strict';
const renderApplicationIds=async()=>{
  try{
    const rows=document.getElementById('appsRows');
    if(!rows||!window.supabase||!window.HFY_SUPABASE_URL||!window.HFY_SUPABASE_PUBLISHABLE_KEY)return;
    const db=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
    const r=await db.from('loan_applications').select('id').order('created_at',{ascending:false});
    if(r.error)throw r.error;
    const trs=[...rows.querySelectorAll('tr')];
    trs.forEach((tr,i)=>{
      if(!tr.querySelector('td'))return;
      const app=r.data?.[i];
      if(!app)return;
      const existing=tr.querySelector('td[data-hfy-application-id]');
      if(existing){existing.textContent=String(app.id);return;}
      const td=document.createElement('td');
      td.setAttribute('data-hfy-application-id','1');
      td.textContent=String(app.id);
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
