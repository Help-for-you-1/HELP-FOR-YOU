/* HELP FOR YOU — FINAL 3-PROBLEM FIX ONLY
   1) Customer -> Approval
   2) EMI full list
   3) Staff User ID + Password generation
   Existing Admin layout/options are not changed.
*/
(function(){
'use strict';
function SB(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function money(v){return Number(v||0).toFixed(2);}
function today(){return new Date().toISOString().slice(0,10);}

/* 1. APPROVAL: keep Customer and Application separate, but always create the application with a valid DB status. */
window.saveCustomer=async function(){
 var sb=SB(),g=function(id){var e=document.getElementById(id);return e?e.value.trim():'';};
 var name=g('cn'),mobile=g('cm');
 if(!name||!mobile)return alert('Name and Mobile are required');
 try{
  var c=await sb.from('customers').insert({
   full_name:name,mobile:mobile,email:g('ce')||null,date_of_birth:g('cd')||null,
   pan_number:g('cp')||null,aadhaar_number:g('ca')||null,state:g('cs')||null,
   district:g('cdist')||null,pincode:g('cz')||null,occupation:g('co')||null,
   monthly_income:g('ci')?Number(g('ci')):null,address:g('caddr')||null,status:'active'
  }).select('id').single();
  if(c.error)throw c.error;
  var amount=Number(g('cLoanAmount')||g('loanAmount')||0);
  var a=await sb.from('loan_applications').insert({
   customer_id:c.data.id,name:name,full_name:name,mobile:mobile,email:g('ce')||null,
   date_of_birth:g('cd')||null,pan_number:g('cp')||null,aadhaar_number:g('ca')||null,
   state:g('cs')||null,city:g('cdist')||null,pincode:g('cz')||null,
   occupation:g('co')||null,monthly_income:g('ci')?Number(g('ci')):null,
   address:g('caddr')||null,requested_amount:amount,loan_amount:amount,
   status:'submitted',kyc_status:'Pending',bank_verification:'Pending',fraud_check:'Pending'
  });
  if(a.error)throw a.error;
  if(window.closeM)window.closeM();
  if(window.loadData)await window.loadData();
  alert('Customer added and sent to Approval.');
 }catch(e){console.error(e);alert('Customer/Approval save failed: '+(e.message||e));}
};

/* 2. EMI: always use the selected loan directly, never the wrong customer-array index. */
window.viewRepay=async function(i){
 var loans=window.db&&window.db.loans?window.db.loans:[];
 var x=loans[i];
 if(!x)return alert('Loan not found.');
 try{
  var sb=SB(),loan=x.raw;
  if(!loan){var lr=await sb.from('loan_accounts').select('*').eq('loan_id',x.loanId).maybeSingle();if(lr.error)throw lr.error;if(!lr.data)throw new Error('Loan ID '+x.loanId+' not found');loan=lr.data;}
  var er=await sb.from('loan_emi_schedule').select('*').eq('loan_id',loan.loan_id).order('emi_number',{ascending:true});
  if(er.error)throw er.error;
  var es=er.data||[],target=Math.max(1,Number(loan.tenure_months||1)*30),seen={};
  es.forEach(function(e){seen[Number(e.emi_number)]=true;});
  var missing=[];
  for(var n=1;n<=target;n++)if(!seen[n]){
   var d=new Date(String(loan.start_date||today())+'T00:00:00');d.setDate(d.getDate()+n);
   missing.push({loan_account_id:loan.id,loan_id:loan.loan_id,customer_id:loan.customer_id,emi_number:n,due_date:d.toISOString().slice(0,10),emi_amount:Number(loan.daily_emi||0),penalty:0,paid_amount:0,status:'upcoming'});
  }
  if(missing.length){var ins=await sb.from('loan_emi_schedule').insert(missing);if(ins.error)throw ins.error;er=await sb.from('loan_emi_schedule').select('*').eq('loan_id',loan.loan_id).order('emi_number',{ascending:true});if(er.error)throw er.error;es=er.data||[];}
  var rows=es.map(function(e){
   var raw=String(e.status||'upcoming').toLowerCase();
   var s=raw==='paid'?'paid':(raw==='overdue'||(raw!=='paid'&&String(e.due_date||'')<today())?'overdue':'pending');
   var a=Number(e.emi_amount||0),p=Number(e.penalty||0),pa=Number(e.paid_amount||0),r=Math.max(0,a+p-pa);
   return '<tr><td>'+esc(e.emi_number)+'</td><td>'+esc(String(e.due_date||'').slice(0,10))+'</td><td>₹'+money(a)+'</td><td>₹'+money(p)+'</td><td>₹'+money(a+p)+'</td><td>₹'+money(pa)+'</td><td>₹'+money(r)+'</td><td class="'+(s==='paid'?'paid':s==='overdue'?'over':'pending')+'"><b>'+s+'</b></td><td>'+(s==='paid'?'<span class="paid"><b>Paid</b></span>':'<button class="btn '+(s==='overdue'?'red':'green')+'" onclick="hfyPay(\''+esc(e.id)+'\')">Paid</button>')+' <button class="btn gray" onclick="hfyEditEmi(\''+esc(e.id)+'\')">Edit</button></td></tr>';
  }).join('');
  openBox('EMI Schedule — '+esc(String(loan.loan_id)),
   '<p><b>'+esc(x.name||'')+'</b> | Mobile: '+esc(x.mobile||'')+' | Sanction Date: '+esc(loan.start_date||'')+'</p>'+ 
   '<div class="wrap"><table style="min-width:1150px"><thead><tr><th>EMI No.</th><th>Due Date</th><th>EMI Amount</th><th>Penalty</th><th>Total Due</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
   '<p><b>Total EMI:</b> '+es.length+'</p>');
 }catch(e){console.error(e);alert('EMI list load failed: '+(e.message||e));}
};
window.hfyEditEmi=async function(id){
 var sb=SB(),r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
 if(r.error)return alert('EMI load failed: '+r.error.message);if(!r.data)return alert('EMI not found');
 var e=r.data,s=String(e.status||'upcoming').toLowerCase();if(s!=='paid'&&s!=='overdue')s='pending';
 openBox('Edit EMI','<div class="form"><label>EMI Number<input value="'+esc(e.emi_number)+'" readonly></label><label>Due Date<input id="hfDue" type="date" value="'+esc(String(e.due_date||'').slice(0,10))+'"></label><label>EMI Amount<input id="hfAmt" type="number" step="0.01" value="'+Number(e.emi_amount||0)+'"></label><label>Penalty<input id="hfPen" type="number" step="0.01" value="'+Number(e.penalty||0)+'"></label><label>Paid Amount<input id="hfPaid" type="number" step="0.01" value="'+Number(e.paid_amount||0)+'"></label><label>Status<select id="hfStatus"><option value="pending" '+(s==='pending'?'selected':'')+'>Pending</option><option value="overdue" '+(s==='overdue'?'selected':'')+'>Overdue</option><option value="paid" '+(s==='paid'?'selected':'')+'>Paid</option></select></label><div class="full"><button class="btn blue" onclick="hfySaveEmi(\''+esc(id)+'\')">Save Changes</button></div></div>');
};
window.hfySaveEmi=async function(id){
 var sb=SB(),a=Number(document.getElementById('hfAmt').value||0),p=Number(document.getElementById('hfPen').value||0),s=document.getElementById('hfStatus').value,d=document.getElementById('hfDue').value,pa=Number(document.getElementById('hfPaid').value||0);
 if(a<=0)return alert('EMI amount must be greater than 0');if(!d)return alert('Due Date is required');var t=a+p;if(s==='paid')pa=t;pa=Math.min(Math.max(pa,0),t);
 var r=await sb.from('loan_emi_schedule').update({due_date:d,emi_amount:a,penalty:p,paid_amount:pa,status:s}).eq('id',id);
 if(r.error)return alert('EMI update failed: '+r.error.message);if(window.closeM)window.closeM();if(window.loadData)await window.loadData();alert('EMI updated successfully');
};
window.hfyPay=async function(id){
 var sb=SB(),r=await sb.from('loan_emi_schedule').select('*').eq('id',id).maybeSingle();
 if(r.error)return alert(r.error.message);if(!r.data)return alert('EMI not found');if(String(r.data.status).toLowerCase()==='paid')return alert('This EMI is already paid.');
 var t=Number(r.data.emi_amount||0)+Number(r.data.penalty||0),u=await sb.from('loan_emi_schedule').update({paid_amount:t,status:'paid'}).eq('id',id);
 if(u.error)return alert('Payment update failed: '+u.error.message);if(window.closeM)window.closeM();if(window.loadData)await window.loadData();alert('EMI marked as Paid successfully');
};

/* 3. STAFF: generate and persist a User ID + Password. */
function randomPassword(){var chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';var out='';for(var i=0;i<10;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
function slug(v){return String(v||'staff').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,10)||'staff';}
window.addStaff=function(){
 openBox('Add Staff','<div class="form"><label>Full Name<input id="stName"></label><label>Email<input id="stEmail" type="email"></label><label>Role<select id="stRole"><option value="staff">Staff</option><option value="manager">Manager</option><option value="collection">Collection</option><option value="admin">Admin</option></select></label><div class="full"><button class="btn green" onclick="saveStaffWithCredentials()">Generate User ID & Password</button></div></div>');
};
window.saveStaffWithCredentials=async function(){
 var sb=SB(),name=(document.getElementById('stName')||{}).value||'',email=(document.getElementById('stEmail')||{}).value||'',role=(document.getElementById('stRole')||{}).value||'staff';
 if(!name.trim())return alert('Staff name is required.');
 try{
  var s=await sb.from('hfy_staff').insert({name:name.trim(),email:email.trim()||null,role:role,status:'active'}).select('id').single();
  if(s.error)throw s.error;
  var login='HFY-'+slug(name)+'-'+String(s.data.id).padStart(4,'0'),pass=randomPassword();
  var c=await sb.from('staff_credentials').insert({staff_id:s.data.id,login_id:login,login_password:pass});
  if(c.error)throw c.error;
  if(window.closeM)window.closeM();
  if(window.loadData)await window.loadData();
  openBox('Staff Login Credentials','<p><b>User ID:</b> '+esc(login)+'</p><p><b>Password:</b> '+esc(pass)+'</p><p>Save these credentials securely.</p>');
 }catch(e){console.error(e);alert('Staff creation failed: '+(e.message||e));}
};

/* Existing Staff button in admin.html has no onclick; attach it without changing the UI. */
function bindStaffButton(){var sec=document.getElementById('staff');if(!sec)return;var b=sec.querySelector('button');if(b){b.onclick=window.addStaff;b.textContent='+ Add Staff';}}
setTimeout(bindStaffButton,1000);
setTimeout(bindStaffButton,3000);

})();