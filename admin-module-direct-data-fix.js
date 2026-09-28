/* HELP FOR YOU — Direct Admin module data + navigation fix */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const CORE=['dash','apps','approval','customers','repay','payments','transactions','overdue','staff','withdrawals'];
const MODULES=['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'];
let sb,busy=false;
function db(){return sb||(sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY))}
async function get(table,order){
 try{let q=db().from(table).select('*');if(order)q=q.order(order,{ascending:false});const r=await q;if(r.error){console.warn('HFY module query',table,r.error);return []}return r.data||[]}
 catch(e){console.warn('HFY module query',table,e);return []}
}
function maps(){
 const c=new Map((window.__HFY_CUSTOMERS||[]).map(x=>[String(x.id),x]));
 return {c};
}
function renderCorePanels(){
 const {c}=maps(), loans=window.__HFY_LOANS||[], pays=window.__HFY_PAYMENTS||[], tx=window.__HFY_TRANSACTIONS||[], staff=window.__HFY_STAFF||[], emis=window.__HFY_EMIS||[];
 const la=document.getElementById('loanAccountsBody');
 if(la){
  const isClosed=x=>['closed','completed'].includes(String(x.loan_status||x.status||'').trim().toLowerCase());
  const table=items=>'<div class="wrap"><table><thead><tr><th>Loan ID</th><th>Customer</th><th>Loan Amount</th><th>Total Repayment</th><th>Paid</th><th>Outstanding</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead><tbody>'+(items.map(x=>'<tr><td>'+esc(x.loan_id)+'</td><td>'+esc(c.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+money(x.loan_amount)+'</td><td>'+money(x.total_repayment)+'</td><td>'+money(x.total_paid)+'</td><td>'+money(x.remaining_amount)+'</td><td>'+esc(x.start_date||'-')+'</td><td>'+esc(x.end_date||'-')+'</td><td>'+esc(x.loan_status||x.status||'-')+'</td></tr>').join('')||'<tr><td colspan="9">No loan accounts found.</td></tr>')+'</tbody></table></div>';
  const active=loans.filter(x=>!isClosed(x)),closed=loans.filter(isClosed);
  la.innerHTML='<div class="actions" style="margin-bottom:12px"><button class="btn blue" id="laActiveBtn">Active Loan</button><button class="btn gray" id="laClosedBtn">Closed Loan</button></div><div id="laList">'+table(active)+'</div>';
  const list=document.getElementById('laList'),ab=document.getElementById('laActiveBtn'),cb=document.getElementById('laClosedBtn');
  if(ab)ab.onclick=()=>{list.innerHTML=table(active);ab.className='btn blue';cb.className='btn gray'};
  if(cb)cb.onclick=()=>{list.innerHTML=table(closed);cb.className='btn blue';ab.className='btn gray'};
 }
 const ac=document.getElementById('accountingBody');
 if(ac)ac.innerHTML='<div class="wrap"><table><thead><tr><th>Transaction ID</th><th>Customer</th><th>Loan ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>'+(tx.map(x=>'<tr><td>'+esc(x.transaction_id||x.id)+'</td><td>'+esc(c.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+esc(x.transaction_type||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.status||'-')+'</td><td>'+esc((x.transaction_date||'').slice(0,10))+'</td></tr>').join('')||'<tr><td colspan="7">No accounting transactions found.</td></tr>')+'</tbody></table></div>';
 const pay=document.getElementById('payments');
 if(pay){
  const total=pays.reduce((n,x)=>n+Number(x.amount||0),0);
  pay.innerHTML='<h2>Payments</h2><div class="actions"><button class="btn blue" onclick="addPayment()">+ Add Payment</button></div><p><b>Total Payments:</b> '+pays.length+' &nbsp; <b>Total Received:</b> '+money(total)+'</p><div class="wrap"><table><thead><tr><th>Customer</th><th>Loan ID</th><th>Amount</th><th>Date</th><th>Type</th><th>Status</th><th>Transaction</th></tr></thead><tbody>'+(pays.map(x=>'<tr><td>'+esc(c.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.payment_date||'-')+'</td><td>'+esc(x.payment_type||'-')+'</td><td>'+esc(x.status||'-')+'</td><td>'+esc(x.transaction_id||'-')+'</td></tr>').join('')||'<tr><td colspan="7">No payments found.</td></tr>')+'</tbody></table></div>';
 }
 const tr=document.getElementById('transactions');
 if(tr)tr.innerHTML='<h2>Transactions</h2><div class="wrap"><table><thead><tr><th>Transaction ID</th><th>Customer</th><th>Loan ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>'+(tx.map(x=>'<tr><td>'+esc(x.transaction_id||x.id)+'</td><td>'+esc(c.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+esc(x.transaction_type||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.status||'-')+'</td><td>'+esc((x.transaction_date||'').slice(0,10))+'</td></tr>').join('')||'<tr><td colspan="7">No transactions found.</td></tr>')+'</tbody></table></div>';
 const st=document.getElementById('staff');
 if(st)st.innerHTML='<h2>Staff/Admin</h2><div class="wrap"><table><thead><tr><th>Employee ID</th><th>Name</th><th>Mobile</th><th>Role</th><th>Status</th><th>Manage</th></tr></thead><tbody>'+(staff.map((x,i)=>'<tr><td>'+esc(x.employee_id||'-')+'</td><td>'+esc(x.name||'-')+'</td><td>'+esc(x.mobile||'-')+'</td><td>'+esc(x.role||'-')+'</td><td>'+esc(x.status||'-')+'</td><td><button class="btn blue" onclick="manageStaff('+i+')">Manage</button><button class="btn green" onclick="staffWallet('+i+')">Wallet</button></td></tr>').join('')||'<tr><td colspan="6">No staff records found.</td></tr>')+'</tbody></table></div>';
 const ov=document.getElementById('ovRows');
 if(ov)ov.innerHTML=(emis.filter(x=>x.status!=='paid'&&Number(x.remaining_amount||0)>0).map(x=>'<tr><td>'+esc(x.loan_id)+'</td><td>'+esc(c.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+money(x.emi_amount)+'</td><td>'+esc(x.due_date||'-')+'</td><td>'+money(x.penalty)+'</td><td>'+money(x.remaining_amount)+'</td><td>—</td></tr>').join('')||'<tr><td colspan="7">No overdue EMI records found.</td></tr>');
}
async function loadStaffDirect(){
 try{const rows=await get('staff','created_at');if(rows.length)window.__HFY_STAFF=rows;return rows}catch(e){console.warn('HFY direct staff load',e);return window.__HFY_STAFF||[]}
}
function renderStaffDirect(){
 const st=document.getElementById('staff');if(!st)return;
 const staff=window.__HFY_STAFF||[];
 st.innerHTML='<h2>Staff/Admin</h2><div class="actions"><button class="btn blue" onclick="addStaff()">+ Add Staff</button></div><div class="wrap"><table><thead><tr><th>Employee ID</th><th>Name</th><th>Mobile</th><th>Role</th><th>Status</th><th>Payment</th><th>Loan Apply</th><th>ID</th><th>Manage</th><th>Wallet</th></tr></thead><tbody>'+(staff.map((x,i)=>'<tr><td>'+esc(x.employee_id||'-')+'</td><td>'+esc(x.name||'-')+'</td><td>'+esc(x.mobile||'-')+'</td><td>'+esc(x.role||'-')+'</td><td>'+esc(x.status||'-')+'</td><td>'+(x.payment_enabled!==false?'🟢':'🔴')+'</td><td>'+(x.loan_apply_enabled!==false?'🟢':'🔴')+'</td><td>'+(x.login_enabled!==false?'🟢':'🔴')+'</td><td><button class="btn blue" onclick="manageStaff('+i+')">Manage</button></td><td><button class="btn green" onclick="staffWallet('+i+')">Wallet</button></td></tr>').join('')||'<tr><td colspan="10">No staff records found.</td></tr>')+'</tbody></table></div>';
}
async function refresh(){
 if(busy)return;
 busy=true;
 try{
  if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return}
  if(typeof window.loadData==='function')await window.loadData();
  await loadStaffDirect();
  renderCorePanels();
  renderStaffDirect();
  if(typeof window.renderPanel==='function')MODULES.forEach(id=>{try{window.renderPanel(id)}catch(e){console.warn('HFY module render',id,e)}});
 }catch(e){console.error('HFY final module refresh',e)}
 finally{busy=false}
}
function activate(id,el){
 document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
 const p=document.getElementById(id);if(p)p.classList.add('on');
 document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
 if(el)el.classList.add('on');
}
async function open(id,el){
 activate(id,el);
 await refresh();
 try{
  if(CORE.includes(id)&&typeof window.renderCore==='function')window.renderCore();
  if(id==='staff')renderStaffDirect();
  if(id==='apps'&&typeof window.loadApplications==='function')await window.loadApplications();
  if(MODULES.includes(id)&&typeof window.renderPanel==='function')window.renderPanel(id);
  if(id==='withdrawals'&&typeof window.renderWithdrawals==='function')window.renderWithdrawals();
 }catch(e){console.error('HFY final navigation',id,e)}
}
function bind(){
 document.querySelectorAll('.side .m').forEach(el=>{
  const raw=el.getAttribute('onclick')||'';
  const m=raw.match(/show\(['"]([^'"]+)['"]/);if(!m)return;
  const id=m[1];
  el.onclick=function(ev){if(ev)ev.preventDefault();open(id,el);return false};
 });
}
async function boot(){bind();await refresh()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();