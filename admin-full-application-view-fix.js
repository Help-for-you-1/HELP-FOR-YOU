/* HELP FOR YOU — View only: self-contained full application editor fallback */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const money=v=>'₹'+Number(v||0).toFixed(2);
function sb(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY)}
function editor(i){
 const rows=window.__HFY_APPLICATIONS||[],x=rows[Number(i)];
 if(!x){alert('Application not found.');return;}
 if(typeof window.editApproval==='function'){window.editApproval(Number(i));return;}
 const h=`<div class="form">
<label>Application ID<input value="${esc(x.id??'')}" readonly></label><label>Customer ID<input value="${esc(x.customer_id??'')}" readonly></label>
<label>Full Name<input id="fv_name" value="${esc(x.full_name||x.name||'')}"></label><label>Parent / Father / Mother Name<input id="fv_parent" value="${esc(x.parent_name||'')}"></label>
<label>Mobile<input id="fv_mobile" value="${esc(x.mobile||'')}"></label><label>Email<input id="fv_email" value="${esc(x.email||'')}"></label>
<label>DOB<input id="fv_dob" type="date" value="${esc(x.date_of_birth||'')}"></label><label>Gender<input id="fv_gender" value="${esc(x.gender||'')}"></label>
<label class="full">Address<input id="fv_address" value="${esc(x.address||'')}"></label><label>House<input id="fv_house" value="${esc(x.house||'')}"></label>
<label>Street<input id="fv_street" value="${esc(x.street||'')}"></label><label>Village<input id="fv_village" value="${esc(x.village||'')}"></label>
<label>Post Office<input id="fv_po" value="${esc(x.post_office||'')}"></label><label>City<input id="fv_city" value="${esc(x.city||'')}"></label>
<label>District<input id="fv_district" value="${esc(x.district||'')}"></label><label>State<input id="fv_state" value="${esc(x.state||'')}"></label>
<label>Pincode<input id="fv_pin" value="${esc(x.pincode||'')}"></label><label>Occupation<input id="fv_occ" value="${esc(x.occupation||'')}"></label>
<label>Monthly Income<input id="fv_income" type="number" value="${x.monthly_income??''}"></label><label>PAN Number<input id="fv_pan" value="${esc(x.pan_number||'')}"></label>
<label>Aadhaar Number<input id="fv_aadhaar" value="${esc(x.aadhaar_number||'')}"></label><label>Bank Account<input id="fv_bank" value="${esc(x.bank_account||'')}"></label>
<label>IFSC Code<input id="fv_ifsc" value="${esc(x.ifsc_code||'')}"></label><label>Loan Type<input id="fv_type" value="${esc(x.loan_type||'')}"></label>
<label class="full">Loan Purpose<input id="fv_purpose" value="${esc(x.loan_purpose||'')}"></label>
<label>Requested Amount<input id="fv_requested" type="number" value="${x.requested_amount??x.loan_amount??0}"></label><label>Sanction / Approved Amount<input id="fv_approved" type="number" value="${x.approved_amount??x.loan_amount??x.requested_amount??0}"></label>
<label>Loan Amount<input id="fv_loan" type="number" value="${x.loan_amount??x.approved_amount??0}"></label><label>Tenure (Months)<input id="fv_tenure" type="number" value="${x.tenure_months??1}"></label>
<label>Interest Rate %<input id="fv_rate" type="number" step="0.01" value="${x.interest_rate??0}"></label><label>EMI Amount<input id="fv_emi" type="number" step="0.01" value="${x.emi_amount??0}"></label>
<label>Daily EMI<input id="fv_daily" type="number" step="0.01" value="${x.daily_emi??0}"></label><label>Total Interest<input id="fv_interest" type="number" step="0.01" value="${x.total_interest??0}"></label>
<label>Total Repayment<input id="fv_total" type="number" step="0.01" value="${x.total_repayment??0}"></label><label>Sanction Date<input id="fv_sanction" type="date" value="${esc(x.sanction_date||'')}"></label>
<label>Status<select id="fv_status"><option>draft</option><option>submitted</option><option>pending</option><option>under_review</option><option>approved</option><option>rejected</option></select></label>
<label>KYC<select id="fv_kyc"><option>Pending</option><option>Under Review</option><option>Verified</option><option>Rejected</option></select></label>
<label>Bank Verification<input id="fv_bankver" value="${esc(x.bank_verification||'Pending')}"></label><label>Fraud Check<input id="fv_fraud" value="${esc(x.fraud_check||'Pending')}"></label>
<label class="full">Admin Remarks<input id="fv_remarks" value="${esc(x.admin_remarks||'')}"></label>
<div class="full"><button class="btn blue" onclick="hfyViewSave(${Number(i)})">Save Full Form</button><button class="btn green" onclick="hfyViewApprove(${Number(i)})">Approve</button><button class="btn red" onclick="hfyViewReject(${Number(i)})">Reject</button></div>
</div>`;
 if(typeof window.openBox==='function')window.openBox('Full Application — View / Edit',h);else{const mt=$('mt'),mb=$('mb'),md=$('modal');if(!mt||!mb||!md)return alert('Application editor is not available.');mt.textContent='Full Application — View / Edit';mb.innerHTML=h;md.classList.add('on');}
 const st=$('fv_status'),ky=$('fv_kyc');if(st)st.value=String(x.status||'submitted').toLowerCase();if(ky)ky.value=x.kyc_status||'Pending';
}
function val(id){return $(id)?.value??''}
function payload(){
 return {full_name:val('fv_name').trim(),mobile:val('fv_mobile').trim(),email:val('fv_email')||null,date_of_birth:val('fv_dob')||null,gender:val('fv_gender')||null,parent_name:val('fv_parent')||null,address:val('fv_address')||null,house:val('fv_house')||null,street:val('fv_street')||null,village:val('fv_village')||null,post_office:val('fv_po')||null,city:val('fv_city')||null,district:val('fv_district')||null,state:val('fv_state')||null,pincode:val('fv_pin')||null,occupation:val('fv_occ')||null,monthly_income:Number(val('fv_income')||0)||null,pan_number:val('fv_pan')||null,aadhaar_number:val('fv_aadhaar')||null,bank_account:val('fv_bank')||null,ifsc_code:val('fv_ifsc')||null,loan_type:val('fv_type')||null,loan_purpose:val('fv_purpose')||null,requested_amount:Number(val('fv_requested')||0),approved_amount:Number(val('fv_approved')||0),loan_amount:Number(val('fv_loan')||0)||null,tenure_months:Number(val('fv_tenure')||1),interest_rate:Number(val('fv_rate')||0),emi_amount:Number(val('fv_emi')||0)||null,daily_emi:Number(val('fv_daily')||0)||null,total_interest:Number(val('fv_interest')||0)||null,total_repayment:Number(val('fv_total')||0)||null,sanction_date:val('fv_sanction')||null,status:val('fv_status'),kyc_status:val('fv_kyc'),bank_verification:val('fv_bankver')||'Pending',fraud_check:val('fv_fraud')||'Pending',admin_remarks:val('fv_remarks')||null};
}
async function save(i,statusOverride){
 try{
  const x=(window.__HFY_APPLICATIONS||[])[Number(i)];if(!x)return;
  const p=payload();if(statusOverride)p.status=statusOverride;
  if(!p.full_name||!p.mobile)return alert('Name and Mobile are required.');
  const client=sb();let r=await client.from('loan_applications').update({...p,updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;
  if(x.customer_id){const cp={full_name:p.full_name,mobile:p.mobile,email:p.email,date_of_birth:p.date_of_birth,occupation:p.occupation,monthly_income:p.monthly_income,address:p.address,district:p.district,state:p.state,pincode:p.pincode,pan_number:p.pan_number,aadhaar_number:p.aadhaar_number,kyc_status:p.kyc_status,updated_at:new Date().toISOString()};r=await client.from('customers').update(cp).eq('id',x.customer_id);if(r.error)throw r.error;}
  if(typeof window.closeM==='function')window.closeM();if(typeof window.loadData==='function')await window.loadData();alert(statusOverride?'Application '+statusOverride+'.':'Update saved.');
 }catch(e){console.error(e);alert('Admin data/action error: '+(e?.message||e));}
}
window.hfyViewSave=i=>save(i);window.hfyViewApprove=i=>save(i,'approved');window.hfyViewReject=i=>save(i,'rejected');
window.viewApp=i=>editor(i);
function bind(){const body=$('appsRows');if(!body)return;if(body.__hfyViewObserver)return;const ob=new MutationObserver(()=>{});ob.observe(body,{childList:true,subtree:true});body.__hfyViewObserver=ob;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();