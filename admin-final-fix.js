/* HELP FOR YOU — final targeted Admin fix
   Keeps the existing Admin layout/options unchanged.
   Fixes only: Add Customer -> Approval, full EMI list, EMI statuses/actions.
*/
(function(){
'use strict';

function getSB(){
  return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function money(v){return Number(v||0).toFixed(2);}
function uiStatus(e){
  var s=String(e.status||'upcoming').toLowerCase();
  if(s==='paid') return 'paid';
  if(s==='overdue') return 'overdue';
  return 'pending';
}

/* Customer -> Approval */
window.saveCustomer=async function(){
  var name=document.getElementById('cn')?.value.trim();
  var mobile=document.getElementById('cm')?.value.trim();
  if(!name||!mobile) return alert('Name and Mobile are required');
  var sb=getSB();
  try{
    var r=await sb.from('customers').insert({
      full_name:name,mobile:mobile,
      email:document.getElementById('ce')?.value||null,
      date_of_birth:document.getElementById('cd')?.value||null,
      pan_number:document.getElementById('cp')?.value||null,
      aadhaar_number:document.getElementById('ca')?.value||null,
      state:document.getElementById('cs')?.value||null,
      district:document.getElementById('cdist')?.value||null,
      pincode:document.getElementById('cz')?.value||null,
      occupation:document.getElementById('co')?.value||null,
      monthly_income:document.getElementById('ci')?.value?Number(document.getElementById('ci').value):null,
      address:document.getElementById('caddr')?.value||null,
      status:'active'
    }).select('id').single();
    if(r.error) throw r.error;
    var cid=r.data.id;
    var a=await sb.from('loan_applications').insert({
      customer_id:cid,full_name:name,name:name,mobile:mobile,
      email:document.getElementById('ce')?.value||null,
      date_of_birth:document.getElementById('cd')?.value||null,
      pan_number:document.getElementById('cp')?.value||null,
      aadhaar_number:document.getElementById('ca')?.value||null,
      state:document.getElementById('cs')?.value||null,
      pincode:document.getElementById('cz')?.value||null,
      occupation:document.getElementById('co')?.value||null,
      monthly_income:document.getElementById('ci')?.value?Number(document.getElementById('ci').value):null,
      address:document.getElementById('caddr')?.value||null,
      requested_amount:0,loan_amount:0,status:'submitted',kyc_status:'Pending'
    });
    if(a.error) throw a.error;
    if(window.closeM) window.closeM();
    if(window.loadData) await window.loadData();
    alert('Customer added and sent to Approval.');
  }catch(e){alert('Customer/Approval save failed: '+(e.message||e));}
};

/* Full EMI View */
window.viewRepay=async function(i){
  var x=window.db&&window.db.customers?window.db.customers[i]:null;
  if(!x) return alert('Customer/Loan not found.');
  var sb=getSB();
  try{
    var lr=await sb.from('loan_accounts').select('*').eq('loan_id',x.loanId).maybeSingle();
    if(lr.error) throw lr.error;
    if(!lr.data) throw new Error('Loan ID '+x.loanId+' not found');
    var loan=lr.data;
    var target=Math.max(1,Number(loan.tenure_months||1)*30);
    var er=await sb.from('loan_emi_schedule').select('*').eq('loan_id',loan.loan_id).order('emi_number',{ascending:true});
    if(er.error) throw er.error;
    var es=er.data||[];
    var existing={};es.forEach(function(e){existing[Number(e.emi_number)]=true;});
    var missing=[];
    for(var n=1;n<=target;n++) if(!existing[n]){
      var d=new Date(String(loan.start_date||new Date().toISOString().slice(0,10))+'T00:00:00');
      d.setDate(d.getDate()+n);
      missing.push({loan_account_id:loan.id,loan_id:loan.loan_id,customer_id:loan.customer_id,emi_number:n,due_date:d.toISOString().slice(0,10),emi_amount:Number(loan.daily_emi||0),penalty:0,paid_amount:0,status:'upcoming'});
    }
    if(missing.length){
      var ins=await sb.from('loan_emi_schedule').insert(missing);
      if(ins.error) throw ins.error;
      er=await sb.from('loan_emi_schedule').select('*').eq('loan_id',loan.loan_id).order('emi_number',{ascending:true});
      if(er.error) throw er.error;
      es=er.data||[];
    }
    var paid=0,remaining=0,penalty=0;
    var rows=es.map(function(e){
      var st=uiStatus(e),a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),rem=Math.max(0,a+p-pa);
      paid+=pa;remaining+=rem;penalty+=p;
      return '<tr><td>'+esc(e.emi_number)+'</td><td>'+esc(String(e.due_date||'').slice(0,10))+'</td><td>₹'+money(a)+'</td><td>₹'+money(p)+'</td><td>₹'+money(a+p)+'</td><td>₹'+money(pa)+'</td><td>₹'+money(rem)+'</td><td class="'+(st==='paid'?'paid':st==='overdue'?'over':'pending')+'"><b>'+st+'</b></td><td>'+(st==='paid'?'<span class="paid"><b>Paid</b></span>':'<button class="btn '+(st==='overdue'?'red':'green')+'" onclick="hfyPay(\''+esc(e.id)+'\')">Paid</button>')+' <button class="btn gray" onclick="hfyEditEmi(\''+esc(e.id)+'\')">Edit</button></td></tr>';
    }).join('');
    openBox('EMI Schedule — '+esc(String(loan.loan_id)),
      '<p><b>'+esc(x.name||'')+'</b> | Mobile: '+esc(x.mobile||'')+' | Sanction Date: '+esc(loan.start_date||'')+'</p>'+ 
      '<div class="wrap"><table style="min-width:1150px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+ 
      '<p><b>Total EMI:</b> '+es.length+' &nbsp; <b>Total Paid:</b> ₹'+money(paid)+' &nbsp; <b>Remaining:</b> ₹'+money(remaining)+' &nbsp; <b>Penalty:</b> ₹'+money(penalty)+'</p>');
  }catch(e){alert('EMI list load failed: '+(e.message||e));}
};

window.hfyEditEmi=async function(id){
  var sb=getSB(),r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(r.error)return alert('EMI load failed: '+r.error.message);if(!r.data)return alert('EMI not found');
  var e=r.data,s=uiStatus(e);
  openBox('Edit EMI','<div class="form">'+
    '<label>EMI Number<input value="'+esc(e.emi_number)+'" readonly></label>'+ 
    '<label>Due Date<input id="hfDue" type="date" value="'+esc(String(e.due_date||'').slice(0,10))+'"></label>'+ 
    '<label>EMI Amount<input id="hfAmt" type="number" step="0.01" value="'+Number(e.emi_amount||0)+'"></label>'+ 
    '<label>Penalty<input id="hfPen" type="number" step="0.01" value="'+Number(e.penalty||0)+'"></label>'+ 
    '<label>Paid Amount<input id="hfPaid" type="number" step="0.01" value="'+Number(e.paid_amount||0)+'"></label>'+ 
    '<label>Status<select id="hfStatus"><option value="upcoming" '+(s==='pending'?'selected':'')+'>Pending</option><option value="overdue" '+(s==='overdue'?'selected':'')+'>Overdue</option><option value="paid" '+(s==='paid'?'selected':'')+'>Paid</option></select></label>'+ 
    '<div class="full"><button class="btn blue" onclick="hfySaveEmi(\''+esc(id)+'\')">Save Changes</button></div></div>');
};

window.hfySaveEmi=async function(id){
  var sb=getSB(),a=Number(document.getElementById('hfAmt').value||0),p=Number(document.getElementById('hfPen').value||0),s=document.getElementById('hfStatus').value,d=document.getElementById('hfDue').value,pa=Number(document.getElementById('hfPaid').value||0);
  if(a<=0)return alert('EMI amount must be greater than 0');if(!d)return alert('Due Date is required');
  var total=a+p;if(s==='paid')pa=total;pa=Math.min(Math.max(pa,0),total);
  var r=await sb.from('loan_emi_schedule').update({due_date:d,emi_amount:a,penalty:p,paid_amount:pa,status:s}).eq('id',id);
  if(r.error)return alert('EMI update failed: '+r.error.message);
  if(window.closeM)window.closeM();if(window.loadData)await window.loadData();alert('EMI updated successfully');
};

window.hfyPay=async function(id){
  var sb=getSB(),r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
  if(r.error)return alert(r.error.message);if(!r.data)return alert('EMI not found');
  var total=Number(r.data.emi_amount||0)+Number(r.data.penalty||0);
  var u=await sb.from('loan_emi_schedule').update({paid_amount:total,status:'paid'}).eq('id',id);
  if(u.error)return alert('Payment update failed: '+u.error.message);
  if(window.closeM)window.closeM();if(window.loadData)await window.loadData();alert('EMI marked as Paid successfully');
};

})();
