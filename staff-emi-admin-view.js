(function(){'use strict';
const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const M=v=>'₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const D=v=>v?new Date(v).toLocaleDateString('en-IN'):'';
function getCustomer(id){return (window.cache?.customers||[]).find(c=>String(c.id)===String(id))||{};}
function renderStaffLoanList(){
 const a=Array.isArray(window.cache?.emis)?window.cache.emis:[]; const map=new Map();
 a.forEach(e=>{const key=String(e.loan_account_id||e.loan_id||''); if(!map.has(key))map.set(key,[]); map.get(key).push(e);});
 const groups=[...map.values()].filter(Boolean); groups.forEach(g=>g.sort((x,y)=>new Date(x.due_date)-new Date(y.due_date)));
 const t=document.getElementById('emiRows'); if(!t)return;
 t.innerHTML=groups.map((g,i)=>{const f=g[0],c=getCustomer(f.customer_id);const due=g.reduce((s,e)=>s+Math.max(0,Number(e.total_due||e.emi_amount||0)-Number(e.paid_amount||0)),0);const next=g.find(e=>Number(e.remaining_amount??(Number(e.total_due||e.emi_amount||0)-Number(e.paid_amount||0)))>0)||f;return `<tr><td>${E(f.loan_id||f.loan_account_id||'')}</td><td>${E(f.customer_name||c.full_name||'')}</td><td>${E(f.customer_mobile||c.mobile||'')}</td><td>${M(due)}</td><td>${D(next.due_date)}</td><td><button class="btn" onclick="window.staffViewLoanEmis(window.staffEmiGroups[${i}])">View</button></td></tr>`;}).join('')||'<tr><td colspan="6">No EMI records</td></tr>';
 window.staffEmiGroups=groups;
}
function view(list){
 if(!Array.isArray(list)||!list.length)return; const f=list[0],c=getCustomer(f.customer_id);
 const rows=list.map(e=>{const total=Number(e.total_due??(Number(e.emi_amount||0)+Number(e.penalty||0))),paid=Number(e.paid_amount||0),rem=Math.max(0,total-paid),st=rem<=0?'paid':String(e.status||'due').toLowerCase();return `<tr><td>${E(e.emi_number)}</td><td>${D(e.due_date)}</td><td>${M(e.emi_amount)}</td><td>${M(e.penalty)}</td><td>${M(total)}</td><td>${M(paid)}</td><td>${M(rem)}</td><td>${E(st)}</td><td>${rem>0?`<button class="btn green" onclick="window.staffOpenEmiPayment(window.cache.emis.find(x=>String(x.id)===\'${E(e.id)}\'))">Pay Now</button>`:'<b class="paid">Paid</b>'}</td></tr>`;}).join('');
 const title=`Loan EMI — ${E(f.loan_id||f.loan_account_id||'')}`;
 const body=`<h3>${title}</h3><p><b>Name:</b> ${E(f.customer_name||c.full_name||'')} &nbsp; <b>Mobile:</b> ${E(f.customer_mobile||c.mobile||'')}</p><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:850px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div><p style="text-align:right"><button class="btn gray" onclick="window.closeM&&window.closeM()">Close</button></p>`;
 if(typeof window.openM==='function')window.openM(title,body);else alert('EMI view unavailable');
}
window.staffEmiGroups=[];window.staffViewLoanEmis=view;window.staffEmiView=view;window.renderStaffLoanList=renderStaffLoanList;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderStaffLoanList);else renderStaffLoanList();
})();