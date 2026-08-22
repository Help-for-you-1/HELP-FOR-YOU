/* HELP FOR YOU — EMI action button fix
   Only fixes EMI action buttons. Existing Admin layout/options stay unchanged.
*/
(function(){
'use strict';

function sb(){
  return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
}
function money(v){return Number(v||0).toFixed(2);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

async function getEmi(id){
  var r=await sb().from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(r.error) throw r.error;
  if(!r.data) throw new Error('EMI not found');
  return r.data;
}

async function refresh(){
  if(window.loadData) await window.loadData();
}

window.hfyPay=async function(id){
  try{
    var e=await getEmi(id);
    if(String(e.status||'').toLowerCase()==='paid'){
      alert('This EMI is already paid.');
      return;
    }
    var total=Number(e.emi_amount||0)+Number(e.penalty||0);
    var r=await sb().from('loan_emi_schedule').update({
      paid_amount:total,
      remaining_amount:0,
      total_due:total,
      status:'paid'
    }).eq('id',id);
    if(r.error) throw r.error;

    // Keep loan balance in sync.
    var a=await sb().from('loan_accounts').select('id,total_paid,remaining_amount').eq('loan_id',e.loan_id).maybeSingle();
    if(a.error) throw a.error;
    if(a.data){
      var paid=Number(a.data.total_paid||0)+total;
      var remaining=Math.max(0,Number(a.data.remaining_amount||0)-total);
      var u=await sb().from('loan_accounts').update({total_paid:paid,remaining_amount:remaining}).eq('id',a.data.id);
      if(u.error) throw u.error;
    }

    if(window.closeM) window.closeM();
    await refresh();
    alert('EMI marked as Paid successfully');
  }catch(e){alert('Payment update failed: '+(e.message||e));}
};

window.pay=window.hfyPay;

window.hfyEditEmi=async function(id){
  try{
    var e=await getEmi(id);
    var status=String(e.status||'upcoming').toLowerCase();
    if(status==='pending') status='upcoming';
    openBox('Edit EMI',
      '<div class="form">'+
      '<label>EMI Number<input value="'+esc(e.emi_number)+'" readonly></label>'+ 
      '<label>Due Date<input id="hfDue" type="date" value="'+esc(String(e.due_date||'').slice(0,10))+'"></label>'+ 
      '<label>EMI Amount<input id="hfAmt" type="number" step="0.01" value="'+Number(e.emi_amount||0)+'"></label>'+ 
      '<label>Penalty<input id="hfPen" type="number" step="0.01" value="'+Number(e.penalty||0)+'"></label>'+ 
      '<label>Paid Amount<input id="hfPaid" type="number" step="0.01" value="'+Number(e.paid_amount||0)+'"></label>'+ 
      '<label>Status<select id="hfStatus">'+
      '<option value="upcoming" '+(status==='upcoming'?'selected':'')+'>Pending</option>'+
      '<option value="overdue" '+(status==='overdue'?'selected':'')+'>Overdue</option>'+
      '<option value="paid" '+(status==='paid'?'selected':'')+'>Paid</option>'+
      '</select></label>'+ 
      '<div class="full"><button class="btn blue" onclick="hfySaveEmi(\''+esc(id)+'\')">Save Changes</button></div>'+ 
      '</div>'
    );
  }catch(e){alert('EMI edit load failed: '+(e.message||e));}
};

window.editEmi=window.hfyEditEmi;

window.hfySaveEmi=async function(id){
  try{
    var amount=Number(document.getElementById('hfAmt').value||0);
    var penalty=Number(document.getElementById('hfPen').value||0);
    var paid=Number(document.getElementById('hfPaid').value||0);
    var due=document.getElementById('hfDue').value;
    var status=document.getElementById('hfStatus').value;
    if(amount<=0) throw new Error('EMI amount must be greater than 0');
    if(!due) throw new Error('Due Date is required');
    var total=amount+penalty;
    if(status==='paid') paid=total;
    paid=Math.min(Math.max(paid,0),total);
    var r=await sb().from('loan_emi_schedule').update({
      due_date:due,emi_amount:amount,penalty:penalty,total_due:total,
      paid_amount:paid,remaining_amount:Math.max(0,total-paid),status:status
    }).eq('id',id);
    if(r.error) throw r.error;
    if(window.closeM) window.closeM();
    await refresh();
    alert('EMI updated successfully');
  }catch(e){alert('EMI update failed: '+(e.message||e));}
};

// Compatibility with the original Admin button names.
window.updateEmi=window.hfySaveEmi;

// Re-assign after all dynamically loaded Admin fix files have finished.
setTimeout(function(){
  window.pay=window.hfyPay;
  window.editEmi=window.hfyEditEmi;
  window.updateEmi=window.hfySaveEmi;
},2500);

})();
