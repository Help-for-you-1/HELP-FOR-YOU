/* HELP FOR YOU — Final Admin data renderer
   Last-loaded safety layer: reads core data directly and refreshes the selected panel. */
(()=>{
'use strict';
let client,loading=false;
const db=()=>client||(client=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const q=(t,o)=>{let x=db().from(t).select('*');return o?x.order(o,{ascending:false}):x};
async function load(){
 if(loading)return;
 loading=true;
 try{
  if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}
  const [a,c,l,e,p,t,s,w]=await Promise.all([
   q('loan_applications','created_at'),q('customers','created_at'),q('loan_accounts','created_at'),
   q('loan_emi_schedule','due_date'),q('loan_repayments','payment_date'),q('financial_transactions','transaction_date'),
   q('staff','created_at'),q('staff_wallets')
  ]);
  const pick=r=>r?.error?[]:(r?.data||[]);
  window.__HFY_APPLICATIONS=pick(a);window.__HFY_CUSTOMERS=pick(c);window.__HFY_LOANS=pick(l);
  window.__HFY_EMIS=pick(e);window.__HFY_PAYMENTS=pick(p);window.__HFY_TRANSACTIONS=pick(t);
  window.__HFY_STAFF=pick(s);window.__HFY_WALLETS=pick(w);
  if(typeof window.render==='function')window.render();
  if(typeof window.renderPanel==='function'){
   ['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].forEach(id=>{try{window.renderPanel(id)}catch(e){console.warn(id,e)}});
  }
  if(typeof window.renderWithdrawals==='function')window.renderWithdrawals();
 }catch(e){console.error('HFY final data renderer',e)}
 finally{loading=false}
}
function bind(){
 document.querySelectorAll('.side .m').forEach(el=>{
  const raw=el.getAttribute('onclick')||'',m=raw.match(/show\(['"]([^'"]+)['"]/);
  if(!m)return;
  const id=m[1];
  el.onclick=async function(ev){
   if(ev)ev.preventDefault();
   document.querySelectorAll('.panel').forEach(x=>x.classList.remove('on'));
   const p=document.getElementById(id);if(p)p.classList.add('on');
   document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));el.classList.add('on');
   await load();
   if(id==='apps'&&typeof window.loadApplications==='function')await window.loadApplications();
   if(['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].includes(id)&&typeof window.renderPanel==='function')window.renderPanel(id);
   if(id==='withdrawals'&&typeof window.renderWithdrawals==='function')window.renderWithdrawals();
   if(id==='staff'){
    const x=document.getElementById('staff');
    if(x&&window.__HFY_STAFF?.length){
     const rows=window.__HFY_STAFF.map((z,i)=>'<tr><td>'+esc(z.employee_id||'-')+'</td><td>'+esc(z.name||'-')+'</td><td>'+esc(z.mobile||'-')+'</td><td>'+esc(z.role||'-')+'</td><td>'+esc(z.status||'-')+'</td><td><button class="btn blue" onclick="manageStaff('+i+')">Manage</button></td><td><button class="btn green" onclick="staffWallet('+i+')">Wallet</button></td></tr>').join('');
     x.innerHTML='<h2>Staff/Admin</h2><div class="wrap"><table><thead><tr><th>Employee ID</th><th>Name</th><th>Mobile</th><th>Role</th><th>Status</th><th>Manage</th><th>Wallet</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    }
   }
   return false;
  };
 });
}
async function boot(){bind();await load();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
