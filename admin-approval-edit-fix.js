/* HELP FOR YOU — Approval editable customer/application fix only. EMI untouched. */
(function(){
'use strict';
function q(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function sb(){return window.HFY_ADMIN_SB||window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
window.editApproval=function(i){
 var rows=(window.HFY_ADMIN_DB&&window.HFY_ADMIN_DB.applications)||[];
 var x=rows[i];
 if(!x){alert('Application not found');return;}
 window.openBox('Edit / Approval','<div class="form">'+
 '<label>Name<input id="en" value="'+esc(x.name||x.full_name)+'"></label>'+
 '<label>Mobile<input id="em" value="'+esc(x.mobile)+'"></label>'+ 
 '<label>Email<input id="ee" value="'+esc(x.email)+'"></label>'+ 
 '<label>DOB<input id="edob" type="date" value="'+esc((x.date_of_birth||'').slice(0,10))+'"></label>'+ 
 '<label>Apply Date<input id="edate" type="date" value="'+esc((x.created_at||'').slice(0,10))+'"></label>'+ 
 '<label>Loan Amount<input id="ea" type="number" value="'+esc(x.requested_amount!=null?x.requested_amount:x.loan_amount)+'"></label>'+ 
 '<label>PAN<input id="epan" value="'+esc(x.pan_number)+'"></label>'+ 
 '<label>Aadhaar<input id="eaad" value="'+esc(x.aadhaar_number)+'"></label>'+ 
 '<label>KYC<input id="ek" value="'+esc(x.kyc_status)+'"></label>'+ 
 '<label>State<input id="estate" value="'+esc(x.state)+'"></label>'+ 
 '<label>District<input id="edistrict" value="'+esc(x.district||x.city)+'"></label>'+ 
 '<label>Pincode<input id="epin" value="'+esc(x.pincode)+'"></label>'+ 
 '<label class="full">Full Address<input id="ead" value="'+esc(x.address)+'"></label>'+ 
 '<div class="full"><button class="btn blue" onclick="saveApprovalEdit('+i+')">Save Changes</button> <button class="btn green" onclick="approve('+i+')">Approve</button> <button class="btn red" onclick="reject('+i+')">Reject</button></div></div>');
};
window.saveApprovalEdit=async function(i){
 var rows=(window.HFY_ADMIN_DB&&window.HFY_ADMIN_DB.applications)||[],x=rows[i];if(!x)return;
 var data={name:q('en'),full_name:q('en'),mobile:q('em'),email:q('ee')||null,date_of_birth:q('edob')||null,requested_amount:Number(q('ea')||0),loan_amount:Number(q('ea')||0),pan_number:q('epan')||null,aadhaar_number:q('eaad')||null,kyc_status:q('ek')||null,state:q('estate')||null,city:q('edistrict')||null,pincode:q('epin')||null,address:q('ead')||null,updated_at:new Date().toISOString()};
 try{
  var r=await sb().from('loan_applications').update(data).eq('id',x.id);if(r.error)throw r.error;
  if(x.customer_id){var c=await sb().from('customers').update({full_name:data.full_name,mobile:data.mobile,email:data.email,date_of_birth:data.date_of_birth,pan_number:data.pan_number,aadhaar_number:data.aadhaar_number,state:data.state,district:data.city,pincode:data.pincode,address:data.address,kyc_status:data.kyc_status}).eq('id',x.customer_id);if(c.error)throw c.error;}
  if(window.closeM)window.closeM(); if(window.loadData)await window.loadData(); alert('Application and customer details updated successfully');
 }catch(e){alert('Save failed: '+(e.message||e));}
};
})();
