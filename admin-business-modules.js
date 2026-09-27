/* HELP FOR YOU — Admin business modules
   Adds the requested loan-management modules without replacing existing EMI/customer logic. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const today=()=>new Date().toISOString().slice(0,10);
let client;
const C=()=>client||(client=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY));
let M={products:[],mandates:[],collections:[],notifications:[],risks:[],audits:[]};
const qid=id=>document.getElementById(id);
const customers=()=>window.__HFY_CUSTOMERS||[];
const loans=()=>window.__HFY_LOANS||[];
function maps(){
 const c=new Map(customers().map(x=>[String(x.id),x]));
 const l=new Map(loans().map(x=>[String(x.id),x]));
 return {c,l};
}
function modal(title,html){if(typeof openBox==='function')openBox(title,html)}
async function getAll(){
 const qs=[
  C().from('loan_products').select('*').order('id'),
  C().from('autopay_mandates').select('*').order('created_at',{ascending:false}),
  C().from('collection_cases').select('*').order('created_at',{ascending:false}),
  C().from('hfy_notifications').select('*').order('created_at',{ascending:false}),
  C().from('loan_risk_assessments').select('*').order('created_at',{ascending:false}),
  C().from('audit_logs').select('*').order('created_at',{ascending:false}).limit(200)
 ];
 const r=await Promise.all(qs.map(p=>p.catch(error=>({data:[],error}))));
 M.products=r[0].error?(console.warn('Loan products:',r[0].error),[]):(r[0].data||[]);
 M.mandates=r[1].error?(console.warn('Mandates:',r[1].error),[]):(r[1].data||[]);
 M.collections=r[2].error?(console.warn('Collections:',r[2].error),[]):(r[2].data||[]);
 M.notifications=r[3].error?(console.warn('Notifications:',r[3].error),[]):(r[3].data||[]);
 M.risks=r[4].error?(console.warn('Risk:',r[4].error),[]):(r[4].data||[]);
 M.audits=r[5].error?(console.warn('Audit:',r[5].error),[]):(r[5].data||[]);
}
async function refresh(){
 try{if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}await getAll();renderCurrent()}catch(e){console.error('Admin modules',e);if(e?.message)console.warn(e.message)}
}
function addNav(id,label){
 if(document.querySelector('.m[data-hfy="'+id+'"],.m[onclick*="show(\\\''+id+'\\\'"]'))return;
 const home=[...document.querySelectorAll('.m')].find(x=>x.textContent.includes('🏠'));
 const d=document.createElement('div');d.className='m';d.dataset.hfy=id;d.textContent=label;d.onclick=()=>window.show(id,d);
 home?.before(d);
}
function addPanel(id,html=''){
 if(qid(id))return;
 const p=document.createElement('section');p.id=id;p.className='panel';p.innerHTML=html;
 document.querySelector('main.main')?.appendChild(p);
}
function ensureActions(id,html,marker){
 const p=qid(id); if(!p||p.querySelector('[data-hfy-action="'+marker+'"]')) return;
 const body=p.querySelector('[id$="Body"]');
 const wrap=document.createElement('div'); wrap.className='actions'; wrap.dataset.hfyAction=marker; wrap.innerHTML=html;
 body?p.insertBefore(wrap,body):p.appendChild(wrap);
}
function setup(){
 addNav('loanaccounts','💼 Loan Accounts');
 addNav('autopay','🔐 AutoPay / Mandate');
 addNav('collections','📞 Collections / Recovery');
 addNav('risk','🛡️ Credit / Risk');
 addNav('documents','📂 Documents');
 addNav('accounting','🧾 Accounting / Ledger');
 addNav('audit','📝 Audit Log');
 addNav('notifications','🔔 Notifications');
 addNav('settings','⚙️ Settings');
 addPanel('loanaccounts','<h2>Loan Accounts</h2><div id="loanAccountsBody">Loading...</div>');
 addPanel('autopay','<h2>AutoPay / Mandate</h2><div id="mandatesBody">Loading...</div>');
 addPanel('collections','<h2>Collections / Recovery</h2><div id="collectionsBody">Loading...</div>');
 addPanel('risk','<h2>Credit / Risk</h2><p class="creditNotice">Internal repayment-risk information only; not an official credit-bureau report.</p><div id="riskBody">Loading...</div>');
 addPanel('documents','<h2>Documents</h2><div id="documentsBody">Loading...</div>');
 addPanel('accounting','<h2>Accounting / Ledger</h2><div id="accountingBody">Loading...</div>');
 addPanel('audit','<h2>Audit Log</h2><div id="auditBody">Loading...</div>');
 addPanel('notifications','<h2>Notifications</h2><div id="notificationsBody">Loading...</div>');
 addPanel('settings','<h2>Settings & Loan Products</h2><div id="settingsBody">Loading...</div>');
 ensureActions('autopay','<button class="btn blue" onclick="addMandate()">+ Add Mandate</button>','autopay-add');
 ensureActions('collections','<button class="btn blue" onclick="addCollectionCase()">+ Add Follow-up</button>','collections-add');
 ensureActions('risk','<button class="btn blue" onclick="addRisk()">+ Add Risk Review</button>','risk-add');
 ensureActions('notifications','<button class="btn blue" onclick="addNotification()">+ Create Notification</button>','notifications-add');
 const oldShow=window.show;
 window.show=function(id,b){oldShow(id,b);if(['loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].includes(id))renderPanel(id)};
 window.__hfyAdminModulesReady=true;
 refresh();
}
function renderCurrent(){
 const active=document.querySelector('.panel.on')?.id;
 if(active)renderPanel(active);
}
function renderPanel(id){
 const {c,l}=maps();
 if(id==='reports')renderReports(c,l);
 if(id==='loanaccounts')renderLoanAccounts(c,l);
 if(id==='autopay')renderMandates(c,l);
 if(id==='collections')renderCollections(c,l);
 if(id==='risk')renderRisk(c,l);
 if(id==='documents')renderDocuments(c,l);
 if(id==='accounting')renderAccounting(c,l);
 if(id==='audit')renderAudit();
 if(id==='notifications')renderNotifications(c,l);
 if(id==='settings')renderSettings();
}
function renderReports(c,l){
 const el=qid('misReportBody');if(!el)return;
 const apps=window.__HFY_APPLICATIONS||[], pays=window.__HFY_PAYMENTS||[], tx=window.__HFY_TRANSACTIONS||[];
 const active=l.filter(x=>!['closed','completed','rejected','cancelled'].includes(String(x.loan_status||'').toLowerCase()));
 const overdue=(window.__HFY_EMIS||[]).filter(x=>x.status!=='paid'&&Number(x.remaining_amount||0)>0&&x.due_date<today());
 const collection=pays.reduce((n,x)=>n+Number(x.amount||0),0);
 const disbursed=l.reduce((n,x)=>n+Number(x.loan_amount||0),0);
 el.innerHTML=`<div class="cards">
 <div class="card">Applications<b>${apps.length}</b></div>
 <div class="card">Active Loans<b>${active.length}</b></div>
 <div class="card">Collection<b>${money(collection)}</b></div>
 <div class="card">Disbursement<b>${money(disbursed)}</b></div>
 <div class="card">Outstanding<b>${money(active.reduce((n,x)=>n+Number(x.remaining_amount||0),0))}</b></div>
 <div class="card">Overdue EMI<b>${overdue.length}</b></div>
 </div>
 <div class="actions"><button class="btn blue" onclick="exportMISReport()">Export MIS CSV</button></div>
 <div class="wrap"><table><thead><tr><th>Loan ID</th><th>Customer</th><th>Loan Amount</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead><tbody>
 ${l.map(x=>'<tr><td>'+esc(x.loan_id)+'</td><td>'+esc(c.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+money(x.loan_amount)+'</td><td>'+money(x.total_paid)+'</td><td>'+money(x.remaining_amount)+'</td><td>'+esc(x.loan_status)+'</td></tr>').join('')||'<tr><td colspan="6">No loan accounts.</td></tr>'}
 </tbody></table></div>`;
}
window.exportMISReport=()=>{
 const rows=[['Loan ID','Customer','Loan Amount','Paid','Outstanding','Status'],...(window.__HFY_LOANS||[]).map(x=>{const c=(window.__HFY_CUSTOMERS||[]).find(z=>String(z.id)===String(x.customer_id));return [x.loan_id,c?.full_name||'',x.loan_amount||0,x.total_paid||0,x.remaining_amount||0,x.loan_status||'']})];
 const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\\n');
 const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='hfy-mis-'+today()+'.csv';a.click();
};
function renderLoanAccounts(c,l){
 const el=qid('loanAccountsBody');if(!el)return;
 el.innerHTML='<div class="wrap"><table><thead><tr><th>Loan ID</th><th>Customer</th><th>Amount</th><th>Total Repayment</th><th>Paid</th><th>Outstanding</th><th>Start</th><th>Status</th><th>Action</th></tr></thead><tbody>'+
 loans().map(x=>'<tr><td>'+esc(x.loan_id)+'</td><td>'+esc(c.get(String(x.customer_id))?.full_name||'-')+'</td><td>'+money(x.loan_amount)+'</td><td>'+money(x.total_repayment)+'</td><td>'+money(x.total_paid)+'</td><td>'+money(x.remaining_amount)+'</td><td>'+esc(x.start_date||'-')+'</td><td>'+esc(x.loan_status)+'</td><td><button class="btn blue" onclick="openLoanAccount('+JSON.stringify(String(x.id))+')">View</button></td></tr>').join('')||'<tr><td colspan="9">No loan accounts.</td></tr>'+'</tbody></table></div>';
}
window.openLoanAccount=async id=>{
 const x=loans().find(z=>String(z.id)===String(id));if(!x)return;
 modal('Loan Account',`<div class="form"><label>Loan ID<input value="${esc(x.loan_id)}" readonly></label><label>Status<select id="las"><option>pending</option><option>approved</option><option>active</option><option>suspended</option><option>completed</option><option>closed</option><option>rejected</option><option>cancelled</option></select></label><label>Loan Amount<input id="lam" type="number" value="${Number(x.loan_amount||0)}"></label><label>Total Repayment<input id="ltr" type="number" value="${Number(x.total_repayment||0)}"></label><label>Start Date<input id="lsd" type="date" value="${esc(x.start_date||'')}"></label><label>End Date<input id="led" type="date" value="${esc(x.end_date||'')}"></label><div class="full"><button class="btn green" onclick="saveLoanAccount('${esc(String(x.id))}')">Save</button></div></div>`);qid('las').value=x.loan_status||'active';
};
window.saveLoanAccount=async id=>{const r=await C().from('loan_accounts').update({loan_amount:+qid('lam').value,total_repayment:+qid('ltr').value,start_date:qid('lsd').value||null,end_date:qid('led').value||null,loan_status:qid('las').value}).eq('id',id);if(r.error)return alert(r.error.message);closeM();if(typeof loadData==='function')await loadData();await refresh();alert('Loan account updated');};

function renderMandates(c,l){
 const el=qid('mandatesBody');if(!el)return;
 el.innerHTML='<div class="actions"><button class="btn blue" onclick="addMandate()">+ Add Mandate</button></div><div class="wrap"><table><thead><tr><th>Customer</th><th>Loan ID</th><th>Provider</th><th>Mandate ID</th><th>Max Amount</th><th>Status</th><th>Start</th><th>End</th><th>Action</th></tr></thead><tbody>'+
 M.mandates.map((x,i)=>'<tr><td>'+esc(c.get(String(x.customer_id))?.full_name||x.customer_id)+'</td><td>'+esc(l.get(String(x.loan_account_id))?.loan_id||'-')+'</td><td>'+esc(x.provider)+'</td><td>'+esc(x.mandate_id||'-')+'</td><td>'+money(x.max_amount)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.start_date||'-')+'</td><td>'+esc(x.end_date||'-')+'</td><td><button class="btn blue" onclick="editMandate('+i+')">Edit</button></td></tr>').join('')||'<tr><td colspan="9">No mandates.</td></tr>'+'</tbody></table></div>';
}
window.addMandate=()=>modal('Add AutoPay Mandate',`<div class="form"><label>Customer ID<input id="mc" type="number"></label><label>Loan Account ID<input id="ml"></label><label>Provider<input id="mp" value="cashfree"></label><label>Mandate ID<input id="mi"></label><label>Max Amount<input id="mm" type="number" step="0.01"></label><label>Status<select id="ms"><option>pending</option><option>active</option><option>paused</option><option>failed</option><option>cancelled</option><option>completed</option></select></label><label>Start Date<input id="mds" type="date"></label><label>End Date<input id="mde" type="date"></label><label class="full">Last Event<input id="me"></label><div class="full"><button class="btn green" onclick="saveMandate()">Save</button></div></div>`);
window.editMandate=i=>{const x=M.mandates[i];modal('Edit AutoPay Mandate',`<div class="form"><label>Provider<input id="mp" value="${esc(x.provider)}"></label><label>Mandate ID<input id="mi" value="${esc(x.mandate_id||'')}"></label><label>Max Amount<input id="mm" type="number" value="${Number(x.max_amount||0)}"></label><label>Status<select id="ms"><option>pending</option><option>active</option><option>paused</option><option>failed</option><option>cancelled</option><option>completed</option></select></label><label>Start Date<input id="mds" type="date" value="${esc(x.start_date||'')}"></label><label>End Date<input id="mde" type="date" value="${esc(x.end_date||'')}"></label><label class="full">Last Event<input id="me" value="${esc(x.last_event||'')}"></label><div class="full"><button class="btn green" onclick="saveMandate('${x.id}')">Save</button></div></div>`);qid('ms').value=x.status};
window.saveMandate=async id=>{const payload={provider:qid('mp').value.trim()||'cashfree',mandate_id:qid('mi').value.trim()||null,max_amount:+qid('mm').value||0,status:qid('ms').value,start_date:qid('mds').value||null,end_date:qid('mde').value||null,last_event:qid('me').value||null};let r;if(id)r=await C().from('autopay_mandates').update(payload).eq('id',id);else r=await C().from('autopay_mandates').insert({...payload,customer_id:+qid('mc').value,loan_account_id:qid('ml').value||null});if(r.error)return alert(r.error.message);closeM();await refresh();alert('Mandate saved');};

function renderCollections(c,l){
 const el=qid('collectionsBody');if(!el)return;
 el.innerHTML='<div class="wrap"><table><thead><tr><th>Customer</th><th>Loan</th><th>Priority</th><th>Status</th><th>Next Follow-up</th><th>Assigned</th><th>Remarks</th><th>Action</th></tr></thead><tbody>'+
 M.collections.map((x,i)=>'<tr><td>'+esc(c.get(String(x.customer_id))?.full_name||x.customer_id)+'</td><td>'+esc(l.get(String(x.loan_account_id))?.loan_id||'-')+'</td><td>'+esc(x.priority)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.next_followup_date||'-')+'</td><td>'+esc(x.assigned_to||'-')+'</td><td>'+esc(x.remarks||'')+'</td><td><button class="btn blue" onclick="editCollectionCase('+i+')">Edit</button></td></tr>').join('')||'<tr><td colspan="8">No collection cases.</td></tr>'+'</tbody></table></div>';
}
function collectionForm(x){x=x||{};return `<div class="form"><label>Customer ID<input id="cc" type="number" value="${esc(x.customer_id||'')}"></label><label>Loan Account ID<input id="cl" value="${esc(x.loan_account_id||'')}"></label><label>Priority<select id="cp"><option>low</option><option>normal</option><option>high</option><option>critical</option></select></label><label>Status<select id="cs"><option>open</option><option>contacted</option><option>promise_to_pay</option><option>resolved</option><option>closed</option></select></label><label>Next Follow-up<input id="cf" type="date" value="${esc(x.next_followup_date||'')}"></label><label>Assigned To<input id="ca" value="${esc(x.assigned_to||'')}"></label><label class="full">Remarks<input id="cr" value="${esc(x.remarks||'')}"></label><div class="full"><button class="btn green" onclick="saveCollectionCase('${esc(x.id||'')}')">Save</button></div></div>`}
window.addCollectionCase=()=>modal('Add Collection Follow-up',collectionForm());
window.editCollectionCase=i=>{const x=M.collections[i];modal('Edit Collection Follow-up',collectionForm(x));qid('cp').value=x.priority;qid('cs').value=x.status};
window.saveCollectionCase=async id=>{const p={customer_id:+qid('cc').value,loan_account_id:qid('cl').value||null,priority:qid('cp').value,status:qid('cs').value,next_followup_date:qid('cf').value||null,assigned_to:qid('ca').value||null,remarks:qid('cr').value||null};let r=id?await C().from('collection_cases').update(p).eq('id',id):await C().from('collection_cases').insert(p);if(r.error)return alert(r.error.message);closeM();await refresh();alert('Collection case saved')};

function renderRisk(c,l){
 const el=qid('riskBody');if(!el)return;
 el.innerHTML='<div class="actions"><button class="btn blue" onclick="addRisk()">+ Add Risk Review</button></div><div class="wrap"><table><thead><tr><th>Customer</th><th>Loan</th><th>Level</th><th>Score</th><th>Reason</th><th>Reviewed By</th><th>Date</th><th>Action</th></tr></thead><tbody>'+
 M.risks.map((x,i)=>'<tr><td>'+esc(c.get(String(x.customer_id))?.full_name||x.customer_id)+'</td><td>'+esc(l.get(String(x.loan_account_id))?.loan_id||'-')+'</td><td>'+esc(x.risk_level)+'</td><td>'+esc(x.score??'-')+'</td><td>'+esc(x.reason||'')+'</td><td>'+esc(x.reviewed_by||'-')+'</td><td>'+esc((x.reviewed_at||x.created_at||'').slice(0,10))+'</td><td><button class="btn blue" onclick="editRisk('+i+')">Edit</button></td></tr>').join('')||'<tr><td colspan="8">No risk reviews.</td></tr>'+'</tbody></table></div>';
}
function riskForm(x){x=x||{};return `<div class="form"><label>Customer ID<input id="rc" type="number" value="${esc(x.customer_id||'')}"></label><label>Loan Account ID<input id="rl" value="${esc(x.loan_account_id||'')}"></label><label>Risk Level<select id="rr"><option>review</option><option>low</option><option>medium</option><option>high</option></select></label><label>Score<input id="rs" type="number" step="0.01" value="${esc(x.score??'')}"></label><label>Reviewed By<input id="rv" value="${esc(x.reviewed_by||'')}"></label><label class="full">Reason<input id="rx" value="${esc(x.reason||'')}"></label><div class="full"><button class="btn green" onclick="saveRisk('${esc(x.id||'')}')">Save</button></div></div>`}
window.addRisk=()=>modal('Add Risk Review',riskForm());
window.editRisk=i=>{const x=M.risks[i];modal('Edit Risk Review',riskForm(x));qid('rr').value=x.risk_level};
window.saveRisk=async id=>{const p={customer_id:+qid('rc').value,loan_account_id:qid('rl').value||null,risk_level:qid('rr').value,score:qid('rs').value===''?null:+qid('rs').value,reason:qid('rx').value||null,reviewed_by:qid('rv').value||null,reviewed_at:new Date().toISOString()};let r=id?await C().from('loan_risk_assessments').update(p).eq('id',id):await C().from('loan_risk_assessments').insert(p);if(r.error)return alert(r.error.message);closeM();await refresh();alert('Risk review saved')};

function renderDocuments(c,l){
 const el=qid('documentsBody');if(!el)return;
 const apps=window.__HFY_APPLICATIONS||[];
 const fields=[['Identity','identity_proof_url'],['PAN','pan_proof_url'],['Address','address_proof_url'],['Bank','bank_proof_url'],['Income','income_proof_url'],['Selfie','selfie_url']];
 el.innerHTML='<div class="wrap"><table><thead><tr><th>Application</th><th>Customer</th><th>Status</th><th>Documents</th></tr></thead><tbody>'+
 apps.map(a=>'<tr><td>#'+esc(a.id)+'</td><td>'+esc(a.full_name||a.name||'-')+'</td><td>'+esc(a.status)+'</td><td>'+(fields.map(f=>a[f[1]]?'<a class="btn gray" target="_blank" rel="noopener" href="'+esc(a[f[1]])+'">'+f[0]+'</a>':'').join(' ')||'No uploaded documents').toString()+'</td></tr>').join('')||'<tr><td colspan="4">No applications.</td></tr>'+'</tbody></table></div>';
}
function renderAccounting(c,l){
 const el=qid('accountingBody');if(!el)return;
 const tx=window.__HFY_TRANSACTIONS||[], pays=window.__HFY_PAYMENTS||[];
 const received=pays.filter(x=>['received','successful','paid'].includes(String(x.status||'').toLowerCase())).reduce((n,x)=>n+Number(x.amount||0),0);
 const successfulTx=tx.filter(x=>String(x.status||'').toLowerCase()==='successful').reduce((n,x)=>n+Number(x.amount||0),0);
 el.innerHTML='<div class="cards"><div class="card">Repayments<b>'+money(received)+'</b></div><div class="card">Successful Transactions<b>'+money(successfulTx)+'</b></div><div class="card">Outstanding<b>'+money(loans().reduce((n,x)=>n+Number(x.remaining_amount||0),0))+'</b></div></div><div class="actions"><button class="btn blue" onclick="exportLedger()">Export Ledger CSV</button></div><div class="wrap"><table><thead><tr><th>Transaction</th><th>Loan</th><th>Amount</th><th>Type</th><th>Method</th><th>Status</th><th>Reference</th><th>Date</th></tr></thead><tbody>'+tx.map(x=>'<tr><td>'+esc(x.transaction_id||x.id)+'</td><td>'+esc(x.loan_id||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.transaction_type||'')+'</td><td>'+esc(x.payment_method||'')+'</td><td>'+esc(x.status||'')+'</td><td>'+esc(x.reference_number||'')+'</td><td>'+esc((x.transaction_date||'').slice(0,10))+'</td></tr>').join('')||'<tr><td colspan="8">No transactions.</td></tr>'+'</tbody></table></div>';
}
window.exportLedger=()=>{const tx=window.__HFY_TRANSACTIONS||[];const rows=[['transaction_id','loan_id','amount','type','method','status','reference','date'],...tx.map(x=>[x.transaction_id||x.id,x.loan_id||'',x.amount||0,x.transaction_type||'',x.payment_method||'',x.status||'',x.reference_number||'',x.transaction_date||''])];const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='hfy-ledger-'+today()+'.csv';a.click()};

function renderAudit(){
 const el=qid('auditBody');if(!el)return;
 el.innerHTML='<div class="wrap"><table><thead><tr><th>Date</th><th>Admin</th><th>Module</th><th>Action</th><th>Reference</th></tr></thead><tbody>'+M.audits.map(x=>'<tr><td>'+esc(x.created_at)+'</td><td>'+esc(x.admin_name||'-')+'</td><td>'+esc(x.module||'-')+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.reference_id||'-')+'</td></tr>').join('')||'<tr><td colspan="5">No audit entries.</td></tr>'+'</tbody></table></div>';
}
async function audit(action,module,ref){try{await C().from('audit_logs').insert({admin_name:'Admin',action,module,reference_id:String(ref||'')})}catch(e){console.warn('audit',e)}}

function renderNotifications(c,l){
 const el=qid('notificationsBody');if(!el)return;
 el.innerHTML='<div class="wrap"><table><thead><tr><th>Customer</th><th>Channel</th><th>Title</th><th>Message</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>'+
 M.notifications.map((x,i)=>'<tr><td>'+esc(c.get(String(x.customer_id))?.full_name||x.customer_id||'-')+'</td><td>'+esc(x.channel)+'</td><td>'+esc(x.title)+'</td><td>'+esc(x.message)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.created_at)+'</td><td><button class="btn green" onclick="markNotificationSent('+i+')">Mark Sent</button></td></tr>').join('')||'<tr><td colspan="7">No notifications.</td></tr>'+'</tbody></table></div>';
}
window.addNotification=()=>modal('Create Notification',`<div class="form"><label>Customer ID<input id="nc" type="number"></label><label>Loan Account ID<input id="nl"></label><label>Channel<select id="nh"><option>internal</option><option>sms</option><option>whatsapp</option><option>email</option></select></label><label>Title<input id="nt"></label><label class="full">Message<input id="nm"></label><div class="full"><button class="btn green" onclick="saveNotification()">Create</button></div></div>`);
window.saveNotification=async()=>{const r=await C().from('hfy_notifications').insert({customer_id:+qid('nc').value||null,loan_account_id:qid('nl').value||null,channel:qid('nh').value,title:qid('nt').value.trim(),message:qid('nm').value.trim()});if(r.error)return alert(r.error.message);await audit('Created notification','Notifications',qid('nc').value);closeM();await refresh();alert('Notification created')};
window.markNotificationSent=async i=>{const x=M.notifications[i];const r=await C().from('hfy_notifications').update({status:'sent',sent_at:new Date().toISOString()}).eq('id',x.id);if(r.error)return alert(r.error.message);await audit('Marked notification sent','Notifications',x.id);await refresh()};

async function renderSettings(){
 const el=qid('settingsBody');if(!el)return;
 const s=await C().from('loan_settings').select('*').limit(1).maybeSingle();
 if(s.error){el.innerHTML='<p class="error">'+esc(s.error.message)+'</p>';return}
 const x=s.data||{};
 if(!qid('settingsBody'))return;
 el.innerHTML=`<h3>Global Loan Settings</h3>
 <div class="form">
  <label>Min Loan Amount<input id="smin" type="number" value="${Number(x.min_loan_amount||0)}"></label>
  <label>Max Loan Amount<input id="smax" type="number" value="${Number(x.max_loan_amount||0)}"></label>
  <label>Monthly Interest %<input id="sir" type="number" step="0.01" value="${Number(x.monthly_interest_rate||0)}"></label>
  <label>Penalty % / day<input id="spp" type="number" step="0.01" value="${Number(x.penalty_percent||0)}"></label>
  <label>Daily EMI<select id="sde"><option value="true">Enabled</option><option value="false">Disabled</option></select></label>
  <div class="full"><button class="btn green" onclick="saveLoanSettings('${esc(String(x.id||''))}')">Save Global Settings</button></div>
 </div>
 <hr><h3>Loan Products / Schemes</h3>
 <div class="actions"><button class="btn blue" onclick="addLoanProduct()">+ Add Product</button></div>
 <div class="wrap"><table><thead><tr><th>Name</th><th>Min</th><th>Max</th><th>Tenure</th><th>Interest</th><th>Fee</th><th>Penalty</th><th>Frequency</th><th>Active</th><th>Action</th></tr></thead><tbody>
 ${M.products.map((p,i)=>'<tr><td>'+esc(p.name)+'</td><td>'+money(p.min_amount)+'</td><td>'+money(p.max_amount)+'</td><td>'+esc(p.tenure_months)+'</td><td>'+esc(p.interest_rate)+'%</td><td>'+money(p.processing_fee)+'</td><td>'+esc(p.penalty_percent)+'%</td><td>'+esc(p.emi_frequency)+'</td><td>'+esc(p.active)+'</td><td><button class="btn blue" onclick="editLoanProduct('+i+')">Edit</button></td></tr>').join('')||'<tr><td colspan="10">No products.</td></tr>'}
 </tbody></table></div>`;
 qid('sde').value=String(x.daily_emi!==false);
}

window.saveLoanSettings=async id=>{const p={min_loan_amount:+qid('smin').value,max_loan_amount:+qid('smax').value,monthly_interest_rate:+qid('sir').value,penalty_percent:+qid('spp').value,daily_emi:qid('sde').value==='true',updated_at:new Date().toISOString()};const r=await C().from('loan_settings').update(p).eq('id',id);if(r.error)return alert(r.error.message);await audit('Updated global loan settings','Settings',id);await refresh();alert('Settings saved')};
function productForm(x){x=x||{};return `<div class="form"><label>Name<input id="pn" value="${esc(x.name||'')}"></label><label>Min Amount<input id="pmin" type="number" value="${Number(x.min_amount||0)}"></label><label>Max Amount<input id="pmax" type="number" value="${Number(x.max_amount||0)}"></label><label>Tenure Months<input id="pt" type="number" min="1" value="${Number(x.tenure_months||1)}"></label><label>Interest %<input id="pi" type="number" step="0.01" value="${Number(x.interest_rate||0)}"></label><label>Processing Fee<input id="pf" type="number" step="0.01" value="${Number(x.processing_fee||0)}"></label><label>Penalty %<input id="pp" type="number" step="0.01" value="${Number(x.penalty_percent||0)}"></label><label>EMI Frequency<select id="pe"><option>daily</option><option>weekly</option><option>monthly</option></select></label><label>Active<select id="pa"><option value="true">Yes</option><option value="false">No</option></select></label><div class="full"><button class="btn green" onclick="saveLoanProduct('${esc(x.id||'')}')">Save</button></div></div>`}
window.addLoanProduct=()=>modal('Add Loan Product',productForm());
window.editLoanProduct=i=>{const x=M.products[i];modal('Edit Loan Product',productForm(x));qid('pe').value=x.emi_frequency;qid('pa').value=String(x.active)};
window.saveLoanProduct=async id=>{const p={name:qid('pn').value.trim(),min_amount:+qid('pmin').value,max_amount:+qid('pmax').value,tenure_months:+qid('pt').value,interest_rate:+qid('pi').value,processing_fee:+qid('pf').value,penalty_percent:+qid('pp').value,emi_frequency:qid('pe').value,active:qid('pa').value==='true',updated_at:new Date().toISOString()};if(!p.name)return alert('Product name required');let r=id?await C().from('loan_products').update(p).eq('id',id):await C().from('loan_products').insert(p);if(r.error)return alert(r.error.message);await audit(id?'Updated loan product':'Created loan product','Settings',id||p.name);closeM();await refresh();alert('Loan product saved')};

async function renderWithdrawals(){const el=qid('withdrawalsBody');if(!el)return;C().from('staff_wallet_withdrawals').select('*,staff:staff_id(employee_id,name,mobile)').order('requested_at',{ascending:false}).then(r=>{if(r.error){el.innerHTML='<p>'+esc(r.error.message)+'</p>';return}const rows=(r.data||[]).map(x=>'<tr><td>'+esc(x.staff?.employee_id||'-')+'</td><td>'+esc(x.staff?.name||'-')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.status)+'</td><td>'+esc(new Date(x.requested_at).toLocaleString())+'</td><td>'+ (x.status==='pending'?'<button class="btn green" onclick="reviewWithdrawal('+x.id+',\'approved\')">Accept</button> <button class="btn red" onclick="reviewWithdrawal('+x.id+',\'rejected\')">Reject</button>':'-')+'</td></tr>').join('')||'<tr><td colspan="6">No withdrawal requests.</td></tr>';el.innerHTML='<div class="wrap"><table><tr><th>Employee ID</th><th>Staff</th><th>Amount</th><th>Status</th><th>Requested</th><th>Action</th></tr>'+rows+'</table></div>'})}
window.reviewWithdrawal=async(id,status)=>{try{const remarks=status==='approved'?'Approved by Admin':'Rejected by Admin';const r=await C().rpc('hfy_review_staff_withdrawal',{p_withdrawal_id:id,p_status:status,p_remarks:remarks});if(r.error)throw r.error;renderWithdrawals();alert(status==='approved'?'Withdrawal approved. Amount deducted from wallet.':'Withdrawal rejected. Amount remains in wallet.')}catch(e){alert(e.message||e)}};
async function syncGlobals(){
 const qs=[
  C().from('customers').select('*'),
  C().from('loan_accounts').select('*'),
  C().from('loan_applications').select('*').order('created_at',{ascending:false}),
  C().from('loan_repayments').select('*'),
  C().from('financial_transactions').select('*'),
  C().from('loan_emi_schedule').select('*')
 ];
 const q=await Promise.all(qs.map(p=>p.catch(error=>({data:[],error}))));
 window.__HFY_CUSTOMERS=q[0].error?(console.warn('Customers:',q[0].error),[]):(q[0].data||[]);
 window.__HFY_LOANS=q[1].error?(console.warn('Loans:',q[1].error),[]):(q[1].data||[]);
 window.__HFY_APPLICATIONS=q[2].error?(console.warn('Applications:',q[2].error),[]):(q[2].data||[]);
 window.__HFY_PAYMENTS=q[3].error?(console.warn('Repayments:',q[3].error),[]):(q[3].data||[]);
 window.__HFY_TRANSACTIONS=q[4].error?(console.warn('Transactions:',q[4].error),[]):(q[4].data||[]);
 window.__HFY_EMIS=q[5].error?(console.warn('EMI:',q[5].error),[]):(q[5].data||[]);
}
window.renderPanel=renderPanel;
window.renderWithdrawals=renderWithdrawals;
const origLoad=window.loadData;
if(origLoad)window.loadData=async function(){const r=await origLoad.apply(this,arguments);await syncGlobals();return r};
async function bootModules(){try{if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}await syncGlobals();setup();renderWithdrawals()}catch(e){console.error('Admin modules boot',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootModules);else bootModules();
})();