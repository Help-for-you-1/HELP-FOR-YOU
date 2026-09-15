/* HELP FOR YOU — ADMIN EMI ALL AMOUNT EDIT ONLY
   Adds Admin-only editing for every editable EMI field.
   Generated Total Due / Remaining Amount are calculated by the database and are NOT sent in update payload.
*/
(function(){
'use strict';
function C(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY)}
function E(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]})}
function N(v){var n=Number(v);return Number.isFinite(n)?n:0}
window.hfyEditEmi=async function(id){
 try{
  var r=await C().from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(r.error)throw r.error;if(!r.data)throw new Error('EMI not found');
  var e=r.data;
  var emi=N(e.emi_amount),pen=N(e.penalty),total=N(e.total_due),paid=N(e.paid_amount),remaining=N(e.remaining_amount);
  var s=String(e.status||'pending').toLowerCase();
  openBox('Edit EMI — All Amounts','<div class="form">'+
   '<label>EMI Number<input value="'+E(e.emi_number)+'" readonly></label>'+ 
   '<label>Due Date<input id="hfyaeDue" type="date" value="'+E(String(e.due_date||'').slice(0,10))+'"></label>'+ 
   '<label>EMI Amount<input id="hfyaeAmt" type="number" min="0" step="0.01" value="'+emi.toFixed(2)+'"></label>'+ 
   '<label>Penalty / Overdue Charges<input id="hfyaePen" type="number" min="0" step="0.01" value="'+pen.toFixed(2)+'"></label>'+ 
   '<label>Total Due<input id="hfyaeTotal" type="text" readonly value="'+total.toFixed(2)+'"></label>'+ 
   '<label>Paid Amount<input id="hfyaePaid" type="number" min="0" step="0.01" value="'+paid.toFixed(2)+'"></label>'+ 
   '<label>Remaining Amount<input id="hfyaeRemain" type="text" readonly value="'+remaining.toFixed(2)+'"></label>'+ 
   '<label>Status<select id="hfyaeStatus"><option value="pending" '+(s==='pending'?'selected':'')+'>Pending</option><option value="overdue" '+(s==='overdue'?'selected':'')+'>Overdue</option><option value="partial" '+(s==='partial'?'selected':'')+'>Partial</option><option value="paid" '+(s==='paid'?'selected':'')+'>Paid</option></select></label>'+ 
   '<div class="full"><button class="btn blue" onclick="hfySaveEmi(\''+E(id)+'\')">Save Changes</button></div></div>');
  function calc(){var a=N(document.getElementById('hfyaeAmt')?.value),p=N(document.getElementById('hfyaePen')?.value),pa=N(document.getElementById('hfyaePaid')?.value),t=a+p;var rm=Math.max(0,t-pa);var ti=document.getElementById('hfyaeTotal'),ri=document.getElementById('hfyaeRemain');if(ti)ti.value=t.toFixed(2);if(ri)ri.value=rm.toFixed(2)}
  document.getElementById('hfyaeAmt')?.addEventListener('input',calc);document.getElementById('hfyaePen')?.addEventListener('input',calc);document.getElementById('hfyaePaid')?.addEventListener('input',calc);
 }catch(e){console.error(e);alert('EMI edit load failed: '+(e.message||e));}
};
window.hfySaveEmi=async function(id){
 try{
  var d=document.getElementById('hfyaeDue')?.value;
  var a=N(document.getElementById('hfyaeAmt')?.value);
  var p=N(document.getElementById('hfyaePen')?.value);
  var pa=N(document.getElementById('hfyaePaid')?.value);
  var s=document.getElementById('hfyaeStatus')?.value||'pending';
  if(!d)throw new Error('Due Date is required');
  if(a<0||p<0||pa<0)throw new Error('Amount cannot be negative');
  var total=a+p;if(pa>total)pa=total;
  if(pa>=total && total>0)s='paid';else if(pa>0)s='partial';
  var payload={due_date:d,emi_amount:a,penalty:p,paid_amount:pa,status:s};
  var r=await C().from('loan_emi_schedule').update(payload).eq('id',id).select('id').maybeSingle();
  if(r.error)throw r.error;
  if(!r.data)throw new Error('EMI was not updated. Please check Admin login/session permissions.');
  if(typeof window.closeM==='function')window.closeM();
  if(typeof window.loadData==='function')await window.loadData();
  if(typeof window.loadEMI==='function')await window.loadEMI();
  if(typeof window.render==='function')await window.render();
  alert('EMI updated successfully.');
 }catch(e){console.error(e);alert('EMI update failed: '+(e.message||e));}
};
window.editEmi=window.hfyEditEmi;
window.updateEmi=window.hfySaveEmi;
})();