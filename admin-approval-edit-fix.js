/* HELP FOR YOU — Approval editable customer/application fix only. EMI untouched. */
(function(){
'use strict';
function q(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';}
function sb(){return window.HFY_ADMIN_SB||window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function apps(){return (window.HFY_ADMIN_DB&&window.HFY_ADMIN_DB.applications)||[];}
window.editApproval=function(i){
 var x=apps()[i];
 if(!x){alert('Application not found');return;}
 var amount=x.requested_amount!=null?x.requested_amount:(x.loan_amount!=null?x.loan_amount:(x.approved_amount||0));
 var tenure=x.tenure_months!=null?x.tenure_months:(x.tenure!=null?x.tenure:'');
 window.openBox('Edit / Approval','<div class="form">'+
 '<label>Name<input id="en" value="'+esc(x.name||x.full_name)+'"></label>'+ 
 '<label>Mobile<input id="em" value="'+esc(x.mobile)+'"></label>'+ 
 '<label>Email<input id="ee" value="'+esc(x.email)+'"></label>'+ 
 '<label>DOB<input id="edob" type="date" value="'+esc((x.date_of_birth||'').slice(0,10))+'"></label>'+ 
 '<label>Apply Date<input id="edate" type="date" value="'+esc((x.created_at||'').slice(0,10))+'"></label>'+ 
 '<label>Loan Amount<input id="ea" type="number" min="1000" max="20000" step="1" value="'+esc(amount)+'"></label>'+ 
 '<label>Loan Tenure<input id="etenure" type="number" min="1" max="3" value="'+esc(tenure)+'"></label>'+ 
 '<label>PAN<input id="epan" value="'+esc(x.pan_number)+'"></label>'+ 
 '<label>Aadhaar<input id="eaad" value="'+esc(x.aadhaar_number)+'"></label>'+ 
 '<label>KYC<input id="ek" value="'+esc(x.kyc_status)+'"></label>'+ 
 '<label>State<input id="estate" value="'+esc(x.state)+'"></label>'+ 
 '<label>District<input id="edistrict" value="'+esc(x.district||x.city)+'"></label>'+ 
 '<label>Pincode<input id="epin" value="'+esc(x.pincode)+'"></label>'+ 
 '<label class="full">Full Address<input id="ead" value="'+esc(x.address)+'"></label>'+ 
 '<div class="full"><button class="btn blue" type="button" onclick="saveApprovalEdit('+i+')">Save Changes</button> <button class="btn green" type="button" onclick="approve('+i+')">Approve</button> <button class="btn red" type="button" onclick="reject('+i+')">Reject</button></div></div>');
};
window.saveApprovalEdit=async function(i){
 var x=apps()[i];if(!x)return;
 var amount=parseFloat(q('ea'));
 if(!Number.isFinite(amount)||amount<1000||amount>20000){alert('Loan amount must be ₹1,000 to ₹20,000');return;}
 var tenure=q('etenure');
 var data={name:q('en'),full_name:q('en'),mobile:q('em'),email:q('ee')||null,date_of_birth:q('edob')||null,requested_amount:amount,loan_amount:amount,tenure_months:tenure?Number(tenure):null,pan_number:q('epan')||null,aadhaar_number:q('eaad')||null,kyc_status:q('ek')||null,state:q('estate')||null,city:q('edistrict')||null,district:q('edistrict')||null,pincode:q('epin')||null,address:q('ead')||null,updated_at:new Date().toISOString()};
 try{
  var r=await sb().from('loan_applications').update(data).eq('id',x.id);if(r.error)throw r.error;
  if(x.customer_id){var c=await sb().from('customers').update({full_name:data.full_name,mobile:data.mobile,email:data.email,date_of_birth:data.date_of_birth,pan_number:data.pan_number,aadhaar_number:data.aadhaar_number,state:data.state,district:data.district,pincode:data.pincode,address:data.address,kyc_status:data.kyc_status}).eq('id',x.customer_id);if(c.error)throw c.error;}
  if(window.closeM)window.closeM();if(window.loadData)await window.loadData();alert('Application and customer details updated successfully');
 }catch(e){alert('Save failed: '+(e.message||e));}
};
/* Keep the existing approve flow, but make its amount/tenure fields reliable. */
var originalApprove=window.approve;
window.approve=async function(i){
 var a=q('ea');var t=q('etenure');
 if(a){var n=parseFloat(a);if(!Number.isFinite(n)||n<1000||n>20000){alert('Loan amount must be ₹1,000 to ₹20,000');return;}}
 if(t){var n2=parseInt(t,10);if(!Number.isFinite(n2)||n2<1||n2>3){alert('Loan tenure must be 1 to 3 months');return;}}
 if(typeof originalApprove==='function')return originalApprove(i);
 alert('Approve function unavailable');
};
})();
