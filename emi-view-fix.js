/* HELP FOR YOU — EMI / Repayment FIX ONLY */
(function(){
'use strict';

function client(){
  if(window.HFY_SUPABASE_URL && window.HFY_SUPABASE_PUBLISHABLE_KEY && window.supabase){
    return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  }
  return null;
}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){return Number(v||0).toFixed(2)}
function today(){return new Date().toISOString().slice(0,10)}
function status(e){
  let s=String(e.status||'pending').toLowerCase();
  if(s==='paid')return 'paid';
  if(s==='overdue')return 'overdue';
  return String(e.due_date||'')<today()?'overdue':'pending';
}

async function getLoan(loanId){
  const sb=client();
  if(!sb)throw new Error('Supabase client not available');
  const l=await sb.from('loan_accounts').select('*').eq('loan_id',loanId).maybeSingle();
  if(l.error)throw l.error;
  if(!l.data)throw new Error('Loan ID '+loanId+' not found');
  const c=await sb.from('customers').select('*').eq('id',l.data.customer_id).maybeSingle();
  if(c.error)throw c.error;
  return {loan:l.data,customer:c.data||{}};
}

async function getEmis(loanId){
  const sb=client();
  const r=await sb.from('loan_emi_schedule').select('*').eq('loan_id',loanId).order('emi_number',{ascending:true});
  if(r.error)throw r.error;
  return r.data||[];
}

function render(x,es){
  let paidCount=0,pendingCount=0,overdueCount=0,total=0,paid=0,remaining=0,penalty=0;
  es.forEach(e=>{
    const s=status(e),a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),r=Math.max(0,a+p-pa);
    total+=a+p;paid+=pa;remaining+=r;penalty+=p;
    if(s==='paid')paidCount++;else if(s==='overdue')overdueCount++;else pendingCount++;
  });
  const rows=es.map(e=>{
    const s=status(e),a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),r=Math.max(0,a+p-pa);
    const action=s==='paid'?'<span class="paid"><b>Paid</b></span>':'<button class="btn '+(s==='overdue'?'red':'green')+'" onclick="hfyPay(\''+esc(e.id)+'\')">Paid</button>';
    return '<tr><td>'+esc(e.emi_number)+'</td><td>'+esc(String(e.due_date||'').slice(0,10))+'</td><td>₹'+money(a)+'</td><td>₹'+money(p)+'</td><td>₹'+money(a+p)+'</td><td>₹'+money(pa)+'</td><td>₹'+money(r)+'</td><td class="'+(s==='paid'?'paid':s==='overdue'?'over':'pending')+'"><b>'+s+'</b></td><td>'+action+' <button class="btn gray" onclick="hfyEditEmi(\''+esc(e.id)+'\')">Edit</button></td></tr>';
  }).join('')||'<tr><td colspan="9">No EMI schedule found.</td></tr>';
  openBox('EMI Schedule — '+esc(x.loanId),
    '<p><b>'+esc(x.name||'')+'</b> | Mobile: '+esc(x.mobile||'')+' | Sanction Date: '+esc(x.sanction||'')+'</p>'+ 
    '<div class="wrap"><table style="min-width:1100px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+ 
    '<p><b>Total EMI:</b> '+es.length+' &nbsp; <b>Paid:</b> '+paidCount+' &nbsp; <b>Pending:</b> '+pendingCount+' &nbsp; <b>Overdue:</b> '+overdueCount+' &nbsp; <b>Total Paid:</b> ₹'+money(paid)+' &nbsp; <b>Remaining:</b> ₹'+money(remaining)+' &nbsp; <b>Penalty:</b> ₹'+money(penalty)+' &nbsp; <b>Total Due:</b> ₹'+money(total)+'</p>'
  );
}

async function viewRepayFix(i){
  try{
    const row=document.querySelectorAll('#reRows tr')[i];
    const loanId=row&&row.cells[2]?row.cells[2].textContent.trim():'';
    if(!loanId)return alert('Loan ID not found.');
    const x=await getLoan(loanId);
    const es=await getEmis(loanId);
    render({loanId:String(x.loan.loan_id),name:x.customer.full_name||'',mobile:x.customer.mobile||'',sanction:x.loan.start_date||''},es);
  }catch(e){console.error(e);alert('EMI list load failed: '+(e.message||e));}
}

async function hfyEditEmi(id){
  const sb=client();
  const r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(r.error)return alert('EMI load failed: '+r.error.message);
  if(!r.data)return alert('EMI not found');
  const e=r.data,s=String(e.status||'pending').toLowerCase();
  openBox('Edit EMI','<div class="form">'+
    '<label>EMI Number<input value="'+esc(e.emi_number)+'" readonly></label>'+ 
    '<label>Due Date<input id="hDue" type="date" value="'+esc(String(e.due_date||'').slice(0,10))+'"></label>'+ 
    '<label>EMI Amount<input id="hAmt" type="number" step="0.01" value="'+Number(e.emi_amount||0)+'"></label>'+ 
    '<label>Penalty<input id="hPen" type="number" step="0.01" value="'+Number(e.penalty||0)+'"></label>'+ 
    '<label>Paid Amount<input id="hPaid" type="number" step="0.01" value="'+Number(e.paid_amount||0)+'"></label>'+ 
    '<label>Status<select id="hStatus"><option value="pending" '+(s==='pending'?'selected':'')+'>Pending</option><option value="overdue" '+(s==='overdue'?'selected':'')+'>Overdue</option><option value="paid" '+(s==='paid'?'selected':'')+'>Paid</option></select></label>'+ 
    '<div class="full"><button class="btn blue" onclick="hfySaveEmi(\''+esc(id)+'\')">Save Changes</button></div></div>');
}

async function hfySaveEmi(id){
  const sb=client(),a=Number(hAmt.value||0),p=Number(hPen.value||0),s=hStatus.value,d=hDue.value;
  let pa=Number(hPaid.value||0); if(a<=0)return alert('EMI amount must be greater than 0'); if(!d)return alert('Due Date is required');
  const total=a+p;if(s==='paid')pa=total;pa=Math.min(Math.max(pa,0),total);const rem=Math.max(0,total-pa);
  const r=await sb.from('loan_emi_schedule').update({due_date:d,emi_amount:a,penalty:p,total_due:total,paid_amount:pa,remaining_amount:rem,status:s}).eq('id',id);
  if(r.error)return alert('EMI update failed: '+r.error.message);
  await recalc(id);closeM();if(window.loadData)await window.loadData();alert('EMI updated successfully');
}

async function hfyPay(id){
  const sb=client();
  const r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(r.error)return alert(r.error.message);if(!r.data)return alert('EMI not found');
  if(String(r.data.status).toLowerCase()==='paid')return alert('This EMI is already paid.');
  const total=Number(r.data.emi_amount||0)+Number(r.data.penalty||0);
  const u=await sb.from('loan_emi_schedule').update({total_due:total,paid_amount:total,remaining_amount:0,status:'paid'}).eq('id',id);
  if(u.error)return alert('Payment update failed: '+u.error.message);
  await recalc(id);closeM();if(window.loadData)await window.loadData();alert('EMI marked as Paid successfully');
}

async function recalc(id){
  try{
    const sb=client(),q=await sb.from('loan_emi_schedule').select('loan_id').eq('id',id).maybeSingle();if(q.error||!q.data)return;
    const e=await sb.from('loan_emi_schedule').select('paid_amount,remaining_amount,penalty').eq('loan_id',q.data.loan_id);if(e.error)return;
    let paid=0,rem=0,pen=0;(e.data||[]).forEach(x=>{paid+=Number(x.paid_amount||0);rem+=Number(x.remaining_amount||0);pen+=Number(x.penalty||0)});
    const l=await sb.from('loan_accounts').select('id').eq('loan_id',q.data.loan_id).maybeSingle();if(l.error||!l.data)return;
    await sb.from('loan_accounts').update({total_paid:paid,remaining_amount:rem,penalty_amount:pen,loan_status:rem<=0?'closed':'active'}).eq('id',l.data.id);
  }catch(e){console.error(e)}
}

function install(){
  if(!window.openBox||!client())return setTimeout(install,200);
  window.viewRepay=viewRepayFix;
  window.hfyEditEmi=hfyEditEmi;
  window.hfySaveEmi=hfySaveEmi;
  window.hfyPay=hfyPay;
}
install();
})();
