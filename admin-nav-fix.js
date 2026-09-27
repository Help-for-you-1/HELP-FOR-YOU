/* HELP FOR YOU — Admin navigation/runtime safety fix */
(()=>{'use strict';
function activate(id,el){
 document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
 const p=document.getElementById(id);
 if(p)p.classList.add('on');
 document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
 if(el)el.classList.add('on');
}
function bind(){
 document.querySelectorAll('.side .m').forEach(el=>{
  const raw=el.getAttribute('onclick')||'';
  const m=raw.match(/show\(['"]([^'"]+)['"]/);
  if(!m)return;
  const id=m[1];
  el.onclick=function(ev){
   if(ev)ev.preventDefault();
   activate(id,el);
   try{
    if(['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].includes(id)&&typeof window.renderPanel==='function')window.renderPanel(id);
    if(id==='withdrawals'&&typeof window.renderWithdrawals==='function')window.renderWithdrawals();
    if(id==='payments'&&typeof window.renderPayments==='function')window.renderPayments();
    if(id==='transactions'&&typeof window.renderTransactions==='function')window.renderTransactions();
    if(id==='overdue'&&typeof window.renderOverdue==='function')window.renderOverdue();
    if(id==='staff'&&typeof window.renderStaff==='function')window.renderStaff();
    if(['dash','customers','approval','repay'].includes(id)&&typeof window.renderCore==='function')window.renderCore();
    if(id==='approval'){(async function(){try{var sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);var q=await sb.from('loan_applications').select('*').order('created_at',{ascending:false});if(q.error)throw q.error;window.__HFY_APPLICATIONS=q.data||[];if(typeof window.hfyRenderApprovalOnly==='function')window.hfyRenderApprovalOnly();setTimeout(function(){if(typeof window.hfyRenderApprovalOnly==='function')window.hfyRenderApprovalOnly();},300);setTimeout(function(){if(typeof window.hfyRenderApprovalOnly==='function')window.hfyRenderApprovalOnly();},1000);}catch(e){console.error('HFY Approval load failed',e);}})();}
    if(id==='apps'&&typeof window.loadApplications==='function')window.loadApplications();
   }catch(e){console.error('HFY Admin option error',id,e);}
   return false;
  };
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();