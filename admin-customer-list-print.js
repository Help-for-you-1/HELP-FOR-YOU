(()=>{
'use strict';
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const dateOnly=v=>v?String(v).slice(0,10):'';
async function getRows(table){const r=await db().from(table).select('*');if(r.error)throw r.error;return r.data||[]}
async function getLists(){
 const [customers,apps,loans,emis]=await Promise.all([getRows('customers'),getRows('loan_applications'),getRows('loan_accounts'),getRows('loan_emi_schedule')]);
 const today=new Date().toISOString().slice(0,10);
 const cById=new Map(customers.map(c=>[String(c.id),c]));
 const lById=new Map(loans.map(l=>[String(l.id),l]));
 const overdue=[];
 const seen=new Set();
 emis.filter(e=>String(e.status||'').toLowerCase()!=='paid'&&dateOnly(e.due_date)<today).forEach(e=>{
   const l=lById.get(String(e.loan_account_id||e.loan_id));
   const customerId=e.customer_id||l?.customer_id;
   const c=cById.get(String(customerId));
   const key=String(customerId)+'|'+String(l?.id||e.loan_id||'');
   if(seen.has(key))return;seen.add(key);
   const days=Math.max(0,Math.floor((Date.now()-new Date(dateOnly(e.due_date)+'T00:00:00').getTime())/86400000));
   const due=Math.max(0,Number(e.emi_amount||0)-Number(e.paid_amount||0))+Number(e.penalty||0);
   overdue.push({name:c?.full_name||c?.name||'—',mobile:c?.mobile||'—',loanId:l?.loan_id||e.loan_id||'—',dueDate:e.due_date,days,due});
 });
 const pending=apps.filter(a=>['pending','submitted','pending approval','pending_for_approval'].includes(String(a.status||'').toLowerCase())).map(a=>({name:a.full_name||a.name||'—',mobile:a.mobile||'—',date:a.created_at||a.apply_date||a.application_date,amount:a.requested_amount||0,status:a.status||'pending'}));
 return {overdue,pending};
}
function printList(title,headers,rows){
 const w=window.open('','_blank');if(!w)return alert('Please allow pop-ups to print.');
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>HELP FOR YOU | '+esc(title)+'</title><style>body{font:12px Arial;color:#172033;margin:0}header{border-bottom:3px solid #123f7a;padding-bottom:12px;margin-bottom:18px}h1{font-size:22px;color:#123f7a;margin:0 0 5px}h2{font-size:15px;margin:0;color:#475569}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#eef3f8;color:#123f7a}.meta{margin:10px 0;color:#64748b}.sign{margin-top:55px;display:flex;justify-content:space-between}.line{border-top:1px solid #172033;width:220px;text-align:center;padding-top:6px}@page{size:A4;margin:14mm}</style></head><body><header><h1>HELP FOR YOU</h1><h2>'+esc(title)+'</h2><div class="meta">Generated: '+new Date().toLocaleDateString('en-IN')+'</div></header><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.join(''):'<tr><td colspan="'+headers.length+'" style="text-align:center">No records found</td></tr>')+'</tbody></table><div class="sign"><div class="line">Prepared By</div><div class="line">Authorised Signatory</div></div></body></html>');w.document.close();w.focus();setTimeout(()=>w.print(),300);
}
window.hfyPrintOverdueCustomers=async()=>{try{const d=await getLists();printList('Overdue Customer List',['Customer Name','Mobile','Loan ID','Due Date','Overdue Days','Total Due'],d.overdue.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.mobile)+'</td><td>'+esc(x.loanId)+'</td><td>'+esc(dateOnly(x.dueDate))+'</td><td>'+esc(x.days)+'</td><td>'+money(x.due)+'</td></tr>'));}catch(e){console.error(e);alert('Overdue list failed: '+(e?.message||e))}};
window.hfyPrintPendingCustomers=async()=>{try{const d=await getLists();printList('Pending Customer List',['Customer Name','Mobile','Apply Date','Requested Amount','Status'],d.pending.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.mobile)+'</td><td>'+esc(dateOnly(x.date))+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.status)+'</td></tr>'));}catch(e){console.error(e);alert('Pending list failed: '+(e?.message||e))}};
window.hfyPrintAllCustomers=async()=>{try{const customers=await getRows('customers');printList('All Customer List',['Customer Name','Mobile','Customer ID','Status'],customers.map(x=>'<tr><td>'+esc(x.full_name||x.name||'—')+'</td><td>'+esc(x.mobile||'—')+'</td><td>'+esc(x.id||'—')+'</td><td>'+esc(x.status||'—')+'</td></tr>'));}catch(e){console.error(e);alert('Customer list failed: '+(e?.message||e))}};
function install(){const body=document.getElementById('hfyReportBody');if(!body||document.getElementById('hfyCustomerPrintLists'))return false;const box=document.createElement('div');box.id='hfyCustomerPrintLists';box.style='margin-top:24px;padding:16px;border:1px solid #dbe3ec;border-radius:12px;background:#f8fafc';box.innerHTML='<h3 style="margin-top:0">Customer Printable Lists</h3><p style="color:#64748b">Each list opens separately in print format.</p><button class="btn red" onclick="hfyPrintOverdueCustomers()">🖨️ Print Overdue Customers</button><button class="btn blue" onclick="hfyPrintPendingCustomers()">🖨️ Print Pending Customers</button><button class="btn green" onclick="hfyPrintAllCustomers()">🖨️ Print All Customers</button>';body.appendChild(box);return true}
let n=0;const timer=setInterval(()=>{install();if(++n>120)clearInterval(timer)},500);new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
})();
