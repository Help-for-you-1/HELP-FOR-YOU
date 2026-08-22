/* HELP FOR YOU — APPROVAL EDIT SAVE FIX ONLY. EMI untouched. */
(function(){
'use strict';
function sb(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
function val(id){var e=document.getElementById(id);return e&&typeof e.value!=='undefined'?String(e.value).trim():'';}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fields(){
 var mb=document.getElementById('mb'),ins=mb?mb.querySelectorAll('input,select,textarea'):[];
 function pick(id,n){var x=val(id);return x||(ins[n]&&String(ins[n].value||'').trim())||'';}
 return {name:pick('en',0),mobile:pick('em',1),date:pick('edate',2),amount:pick('ea',3),email:pick('ee',4),kyc:pick('ek',5),pan:pick('epan',6),aadhaar:pick('eaad',7),state:pick('estate',8),district:pick('edistrict',9),pincode:pick('epin',10),address:pick('ead',11)};
}
window.saveApproval=async function(i){
 var apps=(window.db&&window.db.applications)||[];var x=apps[i];
 if(!x){return alert('Application not found. Please refresh the page.');}
 var f=fields();
 if(!f.name||!f.mobile)return alert('Name and Mobile are required.');
 try{
  var s=sb();
  var appUpdate={name:f.name,full_name:f.name,mobile:f.mobile,requested_amount:f.amount?Number(f.amount):0,kyc_status:f.kyc||null,pan_number:f.pan||null,aadhaar_number:f.aadhaar||null,state:f.state||null,city:f.district||null,pincode:f.pincode||null,address:f.address||null,email:f.email||null};
  if(f.date)appUpdate.created_at=x.created_at;
  var r=await s.from('loan_applications').update(appUpdate).eq('id',x.id);
  if(r.error)throw r.error;
  if(x.customer_id){
   r=await s.from('customers').update({full_name:f.name,mobile:f.mobile,email:f.email||null,date_of_birth:x.date_of_birth||null,pan_number:f.pan||null,aadhaar_number:f.aadhaar||null,state:f.state||null,district:f.district||null,pincode:f.pincode||null,address:f.address||null,kyc_status:f.kyc||null}).eq('id',x.customer_id);
   if(r.error)throw r.error;
  }
  if(window.closeM)window.closeM();
  if(window.loadData)await window.loadData();
  alert('Application and customer details saved successfully.');
 }catch(e){console.error('Approval edit save:',e);alert('Save failed: '+(e.message||e));}
};
})();
