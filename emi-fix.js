/* HELP FOR YOU - EMI VIEW FIX
   This file is intentionally separate so the existing admin.html layout and Supabase connection are not changed.
*/
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function money(v){return Number(v||0).toFixed(2);}
  function sb(){return window.supabaseClient || window.sb || null;}

  window.openAllEmis = async function(loanId, customerName){
    const client=sb();
    if(!client){alert('Supabase client not found.');return;}
    const r=await client.from('loan_emi_schedule').select('*').eq('loan_id',loanId).order('emi_number',{ascending:true});
    if(r.error){alert('EMI load failed: '+r.error.message);return;}
    const rows=r.data||[];
    let html='<h3>'+esc(customerName||'')+' | Loan ID: '+esc(loanId)+'</h3>';
    html+='<div class="wrap"><table><thead><tr><th>EMI</th><th>Due Date</th><th>Amount</th><th>Penalty</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    html+=rows.map(e=>{
      let status=String(e.status||'pending').toLowerCase();
      if(status!=='paid' && e.due_date && new Date(e.due_date+'T00:00:00')<new Date(new Date().toISOString().slice(0,10)+'T00:00:00')) status='overdue';
      const cls=status==='paid'?'paid':status==='overdue'?'over':'pending';
      return '<tr><td>'+esc(e.emi_number)+'</td><td>'+esc(e.due_date)+'</td><td>₹'+money(e.emi_amount)+'</td><td>₹'+money(e.penalty)+'</td><td>₹'+money(e.paid_amount)+'</td><td>₹'+money(e.remaining_amount)+'</td><td class="'+cls+'">'+esc(status)+'</td><td>'+(status==='paid'?'<span class="paid">Paid</span>':'<button class="btn green" onclick="emiFixPaid(\''+esc(e.id)+'\')">Paid</button>')+' <button class="btn gray" onclick="emiFixEdit(\''+esc(e.id)+'\')">Edit</button></td></tr>';
    }).join('')||'<tr><td colspan="8">No EMI found.</td></tr>';
    html+='</tbody></table></div>';
    if(typeof openBox==='function') openBox('All EMI — Loan '+loanId,html); else alert('EMI list loaded: '+rows.length);
  };

  window.emiFixPaid=async function(id){
    const client=sb(); if(!client)return alert('Supabase client not found.');
    const q=await client.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
    if(q.error||!q.data)return alert(q.error?.message||'EMI not found.');
    const e=q.data, due=Number(e.emi_amount||0)+Number(e.penalty||0);
    const r=await client.from('loan_emi_schedule').update({paid_amount:due,remaining_amount:0,status:'paid'}).eq('id',id);
    if(r.error)return alert('Payment update failed: '+r.error.message);
    alert('EMI marked Paid successfully.');
    if(typeof loadData==='function') await loadData();
  };

  window.emiFixEdit=async function(id){
    const client=sb(); if(!client)return alert('Supabase client not found.');
    const q=await client.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
    if(q.error||!q.data)return alert(q.error?.message||'EMI not found.');
    const e=q.data;
    const html='<div class="form"><label>EMI Number<input value="'+esc(e.emi_number)+'" readonly></label><label>Due Date<input id="fixDue" type="date" value="'+esc(e.due_date)+'"></label><label>EMI Amount<input id="fixAmt" type="number" step="0.01" value="'+money(e.emi_amount)+'"></label><label>Penalty<input id="fixPenalty" type="number" step="0.01" value="'+money(e.penalty)+'"></label><label>Paid Amount<input id="fixPaid" type="number" step="0.01" value="'+money(e.paid_amount)+'"></label><label>Status<select id="fixStatus"><option value="pending">Pending</option><option value="overdue">Overdue</option><option value="paid">Paid</option></select></label><div class="full"><button class="btn blue" onclick="emiFixSave(\''+esc(id)+'\')">Save Changes</button></div></div>';
    if(typeof openBox==='function'){openBox('Edit EMI',html); setTimeout(function(){document.getElementById('fixStatus').value=String(e.status||'pending').toLowerCase();},0);}
  };

  window.emiFixSave=async function(id){
    const client=sb(); if(!client)return alert('Supabase client not found.');
    const amount=Number(document.getElementById('fixAmt').value||0), penalty=Number(document.getElementById('fixPenalty').value||0), paid=Number(document.getElementById('fixPaid').value||0), status=document.getElementById('fixStatus').value;
    const total=amount+penalty, remaining=status==='paid'?0:Math.max(0,total-paid);
    const r=await client.from('loan_emi_schedule').update({due_date:document.getElementById('fixDue').value,emi_amount:amount,penalty:penalty,total_due:total,paid_amount:status==='paid'?total:Math.min(paid,total),remaining_amount:remaining,status:status}).eq('id',id);
    if(r.error)return alert('EMI update failed: '+r.error.message);
    if(typeof closeM==='function')closeM();
    if(typeof loadData==='function')await loadData();
    alert('EMI updated successfully.');
  };
})();
