/* HELP FOR YOU — Final Admin data/navigation controller
   Loads core data first, then refreshes business modules from their own tables.
   Existing customer/EMI/payment functionality is preserved. */
(()=>{
'use strict';
let client,loading=false;
const db=()=>client||(client=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY));
const q=(t,o)=>{let x=db().from(t).select('*');return o?x.order(o,{ascending:false}):x};
async function loadCore(){
  if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return false;}
  const [a,c,l,e,p,t,s,w]=await Promise.all([
    q('loan_applications','created_at'),q('customers','created_at'),q('loan_accounts','created_at'),
    q('loan_emi_schedule','due_date'),q('loan_repayments','payment_date'),q('financial_transactions','transaction_date'),
    q('staff','created_at'),q('staff_wallets')
  ]);
  const pick=r=>r?.error?[]:(r?.data||[]);
  window.__HFY_APPLICATIONS=pick(a);
  window.__HFY_CUSTOMERS=pick(c);
  window.__HFY_LOANS=pick(l);
  window.__HFY_EMIS=pick(e);
  window.__HFY_PAYMENTS=pick(p);
  window.__HFY_TRANSACTIONS=pick(t);
  window.__HFY_STAFF=pick(s);
  window.__HFY_WALLETS=pick(w);
  if(typeof window.render==='function')window.render();
  renderAppsDirect();
  return true;
}
function renderAppsDirect(){
  const body=document.getElementById('appsRows');
  const rows=window.__HFY_APPLICATIONS||[];
  if(!body)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'₹'+Number(v||0).toFixed(2);
  body.innerHTML=(rows.map((x,i)=>{
    const s=String(x.status||'').toLowerCase();
    const cls=s==='approved'?'paid':(s==='rejected'?'over':(['draft','submitted','pending','under_review'].includes(s)?'pending':''));
    return '<tr><td>'+esc(x.id??'-')+'</td><td>'+esc(x.full_name||'-')+'</td><td>'+esc(x.mobile||'-')+'</td><td>'+esc((x.applied_at||x.created_at||'').slice(0,10))+'</td><td>'+money(x.requested_amount||0)+'</td><td class="'+cls+'">'+esc(x.status||'-')+'</td><td><button class="btn gray" onclick="viewApp('+i+')">View</button></td></tr>';
  }).join('')||'<tr><td colspan="7">No applications found.</td></tr>');
}
window.viewApp=function(i){
  const rows=window.__HFY_APPLICATIONS||[];
  const x=rows[i];
  if(!x)return alert('Application not found.');
  if(typeof window.editApproval==='function'){ window.editApproval(i); return; }
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'₹'+Number(v||0).toFixed(2);
  const d=document.getElementById('modal'),mt=document.getElementById('mt'),mb=document.getElementById('mb');
  if(!d||!mt||!mb)return alert('Application details: '+(x.full_name||'-')+' | Mobile: '+(x.mobile||'-')+' | Amount: '+money(x.requested_amount)+' | Status: '+(x.status||'-'));
  mt.textContent='Application Details';
  mb.innerHTML='<div class="card"><p><b>Name:</b> '+esc(x.full_name||'-')+'</p><p><b>Mobile:</b> '+esc(x.mobile||'-')+'</p><p><b>Email:</b> '+esc(x.email||'-')+'</p><p><b>Application ID:</b> '+esc(x.id??'-')+'</p><p><b>Requested Amount:</b> '+money(x.requested_amount)+'</p><p><b>Approved Amount:</b> '+money(x.approved_amount)+'</p><p><b>Tenure:</b> '+esc(x.tenure_months??'-')+' Month(s)</p><p><b>Status:</b> '+esc(x.status||'-')+'</p><p><b>Applied Date:</b> '+esc((x.applied_at||x.created_at||'').slice(0,10))+'</p></div>';
  d.classList.add('on');
};
async function loadModules(){
  if(typeof window.__hfyRefreshModules==='function'){
    await window.__hfyRefreshModules();
    return;
  }
  if(typeof window.renderPanel==='function'){
    ['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings']
      .forEach(id=>{try{window.renderPanel(id)}catch(e){console.warn('HFY module render',id,e)}});
  }
  if(typeof window.renderWithdrawals==='function')window.renderWithdrawals();
}
async function refresh(){
  if(loading)return;
  loading=true;
  try{
    const ok=await loadCore();
    if(!ok)return;
    await loadModules();
  }catch(e){console.error('HFY final admin loader',e)}
  finally{loading=false}
}
function activate(id,el){
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('on'));
  const p=document.getElementById(id);if(p)p.classList.add('on');
  document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
  if(el)el.classList.add('on');
}
function bind(){
  document.querySelectorAll('.side .m').forEach(el=>{
    const raw=el.getAttribute('onclick')||'';
    const m=raw.match(/show\(['"]([^'"]+)['"]/);
    if(!m)return;
    const id=m[1];
    el.onclick=async function(ev){
      if(ev)ev.preventDefault();
      activate(id,el);
      await refresh();
      try{
        if(id==='apps'){renderAppsDirect();if(typeof window.loadApplications==='function')await window.loadApplications();renderAppsDirect();}
        else if(['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].includes(id)&&typeof window.renderPanel==='function')window.renderPanel(id);
        else if(id==='withdrawals'&&typeof window.renderWithdrawals==='function')await window.renderWithdrawals();
        else if(['dash','approval','customers','repay'].includes(id)&&typeof window.renderCore==='function')window.renderCore();
        else if(id==='staff'&&typeof window.renderStaff==='function')window.renderStaff();
        else if(['payments','transactions','overdue'].includes(id)&&typeof window.render==='function')window.render();
      }catch(e){console.error('HFY final navigation',id,e)}
      return false;
    };
  });
}
async function boot(){bind();await refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();