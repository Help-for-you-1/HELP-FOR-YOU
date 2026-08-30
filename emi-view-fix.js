/* HELP FOR YOU — EMI / Repayment VIEW FIX ONLY */
(function(){
'use strict';
function client(){if(window.HFY_SUPABASE_URL&&window.HFY_SUPABASE_PUBLISHABLE_KEY&&window.supabase)return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);return null;}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){return Number(v||0).toFixed(2)}
function today(){return new Date().toISOString().slice(0,10)}
function status(e){let s=String(e.status||'pending').toLowerCase();if(s==='paid')return 'paid';if(s==='overdue')return 'overdue';return String(e.due_date||'')<today()?'overdue':'pending';}
window.hfyPay=async function(id){
 try{
  if(!id)return alert('EMI record not found.');
  const sb=client();if(!sb)throw new Error('Supabase client not available');
  const r=await sb.rpc('hfy_mark_emi_paid',{p_emi_id:id});
  if(r.error)throw r.error;
  if(typeof window.closeM==='function')window.closeM();
  if(typeof window.loadData==='function')await window.loadData();
  alert(r.data?.already_paid?'This EMI is already paid.':'EMI marked as Paid successfully.');
 }catch(e){console.error(e);alert('EMI Payment error: '+(e?.message||e));}
};
window.emiFinalPaid=window.hfyPay;
window.emi30Paid=window.hfyPay;
window.paid=window.hfyPay;
async function viewRepayFix(i){try{
 const row=document.querySelectorAll('#reRows tr')[i];
 if(!row)return alert('EMI record not found.');
 const cells=row.cells;
 const loanId=cells[1]?cells[1].textContent.trim():'';
 if(!loanId)return alert('Loan ID not found.');
 const sb=client();if(!sb)throw new Error('Supabase client not available');
 const l=await sb.from('loan_accounts').select('*').eq('loan_id',loanId).maybeSingle();
 if(l.error)throw l.error;if(!l.data)return alert('Loan ID '+loanId+' not found.');
 const c=await sb.from('customers').select('full_name,mobile').eq('id',l.data.customer_id).maybeSingle();
 if(c.error)throw c.error;
 const q=await sb.from('loan_emi_schedule').select('*').eq('loan_id',loanId).order('emi_number',{ascending:true});
 if(q.error)throw q.error;const es=q.data||[];
 let paidCount=0,pendingCount=0,overdueCount=0,total=0,paid=0,remaining=0,penalty=0;
 const rows=es.map(e=>{const s=status(e),a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),r=Math.max(0,a+p-pa);total+=a+p;paid+=pa;remaining+=r;penalty+=p;if(s==='paid')paidCount++;else if(s==='overdue')overdueCount++;else pendingCount++;const action=s==='paid'?'<span class="paid"><b>Paid</b></span>':'<button class="btn '+(s==='overdue'?'red':'green')+'" onclick="hfyPay(\''+esc(e.id)+'\')">Pay Now</button>';return '<tr><td>'+esc(e.emi_number)+'</td><td>'+esc(String(e.due_date||'').slice(0,10))+'</td><td>₹'+money(a)+'</td><td>₹'+money(p)+'</td><td>₹'+money(a+p)+'</td><td>₹'+money(pa)+'</td><td>₹'+money(r)+'</td><td class="'+(s==='paid'?'paid':s==='overdue'?'over':'pending')+'"><b>'+s+'</b></td><td>'+action+' <button class="btn gray" onclick="hfyEditEmi(\''+esc(e.id)+'\')">Edit</button></td></tr>';}).join('')||'<tr><td colspan="9">No EMI schedule found.</td></tr>';
 openBox('EMI Schedule — '+esc(loanId),'<p><b>'+esc(c.data?.full_name||'')+'</b> | Mobile: '+esc(c.data?.mobile||'')+' | Sanction Date: '+esc(l.data.start_date||'')+'</p><div class="wrap"><table style="min-width:1100px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div><p><b>Total EMI:</b> '+es.length+' &nbsp; <b>Paid:</b> '+paidCount+' &nbsp; <b>Pending:</b> '+pendingCount+' &nbsp; <b>Overdue:</b> '+overdueCount+' &nbsp; <b>Total Paid:</b> ₹'+money(paid)+' &nbsp; <b>Remaining:</b> ₹'+money(remaining)+' &nbsp; <b>Penalty:</b> ₹'+money(penalty)+' &nbsp; <b>Total Due:</b> ₹'+money(total)+'</p>');
 }catch(e){console.error(e);alert('EMI list load failed: '+(e.message||e));}}
function install(){if(!window.openBox||!client())return setTimeout(install,200);window.viewEmi=viewRepayFix;window.viewRepay=viewRepayFix;}
install();
})();
