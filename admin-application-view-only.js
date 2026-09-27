/* HELP FOR YOU — Application View only */
(()=>{
'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function docUrl(url){const u=String(url||'').trim();if(!u)return '';if(/^https?:\/\//i.test(u))return u;try{if(window.supabase&&window.HFY_SUPABASE_URL&&window.HFY_SUPABASE_PUBLISHABLE_KEY){const s=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);const p=s.storage.from('loan-documents').getPublicUrl(u);if(p?.data?.publicUrl)return p.data.publicUrl;}}catch(e){}return u;}\nfunction link(label,url){const u=String(url||'').trim();return u?'<a href="'+esc(u)+'" target="_blank" rel="noopener" style="display:inline-block;margin:4px 6px 4px 0">View '+esc(label)+'</a>':'<span style="color:#888;margin-right:10px">'+esc(label)+': Not uploaded</span>';}
function field(label,id,value,type){return '<label>'+label+'<input id="'+id+'" type="'+(type||'text')+'" value="'+esc(value??'')+'"></label>';}
function fallbackEditor(i){
 const rows=window.__HFY_APPLICATIONS||[],x=rows[Number(i)],mb=document.getElementById('mb'),modal=document.getElementById('modal');
 if(!x){alert('Application not found.');return;}
 if(!mb||!modal){alert('Application editor is unavailable.');return;}
 mb.innerHTML='<div class="form">'+
 field('Application ID','av_id',x.id??'')+field('Customer ID','av_cid',x.customer_id??'')+
 field('Full Name','an',x.full_name||x.name||'')+field('Parent / Father / Mother Name','apn',x.parent_name||'')+
 field('Mobile','am',x.mobile||'')+field('Email','ae',x.email||'')+
 field('DOB','ad',x.date_of_birth||'','date')+field('Gender','ag',x.gender||'')+
 '<label class="full">Address<input id="ax" value="'+esc(x.address||'')+'"></label>'+
 field('House','ah',x.house||'')+field('Street','astreet',x.street||'')+field('Village','av',x.village||'')+
 field('Post Office','apo',x.post_office||'')+field('City','acity',x.city||'')+field('District','adi',x.district||'')+
 field('State','as',x.state||'')+field('Pincode','ap',x.pincode||'')+field('Occupation','ao',x.occupation||'')+
 field('Monthly Income','ai',x.monthly_income??'','number')+field('PAN Number','apan',x.pan_number||'')+
 field('Aadhaar Number','aad',x.aadhaar_number||'')+field('Bank Account','aba',x.bank_account||'')+field('IFSC Code','aifsc',x.ifsc_code||'')+
 field('Loan Type','alt',x.loan_type||'')+
 '<label class="full">Loan Purpose<input id="alp" value="'+esc(x.loan_purpose||'')+'"></label>'+
 field('Requested Amount','arq',x.requested_amount??x.loan_amount??0,'number')+
 field('Sanction / Approved Amount','aa',x.approved_amount??x.loan_amount??x.requested_amount??0,'number')+
 field('Loan Amount','ala',x.loan_amount??x.approved_amount??0,'number')+
 '<label>Tenure (Months)<select id="at"><option value="1">1 Month</option><option value="2">2 Months</option><option value="3">3 Months</option><option value="6">6 Months</option><option value="12">12 Months</option></select></label>'+
 field('Interest Rate %','air',x.interest_rate??0,'number')+field('EMI Amount','aemi',x.emi_amount??0,'number')+
 field('Daily EMI','adaily',x.daily_emi??0,'number')+field('Total Interest','ati',x.total_interest??0,'number')+
 field('Total Repayment','atr',x.total_repayment??0,'number')+field('Sanction Date','asd',x.sanction_date||'','date')+
 '<label>Status<select id="ast"><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="pending">Pending</option><option value="under_review">Under Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>'+
 '<label>KYC<select id="ak"><option>Pending</option><option>Under Review</option><option>Verified</option><option>Rejected</option></select></label>'+
 field('Bank Verification','ab',x.bank_verification||'Pending')+field('Fraud Check','af',x.fraud_check||'Pending')+
 '<label class="full">Admin Remarks<input id="ar" value="'+esc(x.admin_remarks||'')+'"></label>'+
 '<div class="full"><button class="btn blue" onclick="saveApproval('+Number(i)+')">Save Full Form</button><button class="btn green" onclick="approve('+Number(i)+')">Approve</button><button class="btn red" onclick="reject('+Number(i)+')">Reject</button></div></div>';
 const at=document.getElementById('at'),ast=document.getElementById('ast'),ak=document.getElementById('ak');
 if(at)at.value=String(x.tenure_months||1);if(ast)ast.value=String(x.status||'submitted').toLowerCase();if(ak)ak.value=x.kyc_status||'Pending';
 document.getElementById('mt').textContent='Full Application — View / Edit';modal.classList.add('on');
}
async function view(i){
 const rows=window.__HFY_APPLICATIONS||[],x=rows[Number(i)];if(!x){alert('Application not found.');return;}
 if(typeof window.editApproval==='function')window.editApproval(Number(i));else fallbackEditor(Number(i));
 const mb=document.getElementById('mb'),modal=document.getElementById('modal'),closeBtn=modal&&modal.querySelector('.box > button');
 if(closeBtn)closeBtn.onclick=function(){if(modal)modal.classList.remove('on');};if(!mb)return;
 const customers=window.__HFY_CUSTOMERS||[],c=customers.find(v=>String(v.id)===String(x.customer_id))||{},old=mb.innerHTML;
 const extra='<div style="margin-top:14px;padding:12px;border:1px solid #ddd;border-radius:10px"><h3 style="margin:0 0 10px">Additional Application Details</h3><div class="form">'+
 '<label>Customer Code<input value="'+esc(c.customer_code||'')+'" readonly></label><label>Applied Date<input value="'+esc(x.applied_at||'')+'" readonly></label>'+
 '<label>Created At<input value="'+esc(x.created_at||'')+'" readonly></label><label>Updated At<input value="'+esc(x.updated_at||'')+'" readonly></label>'+
 '<label class="full">Staff Remarks<textarea readonly>'+esc(c.staff_remarks||x.staff_remarks||'')+'</textarea></label>'+
 '<div class="full"><b>KYC / Uploaded Documents</b><div style="margin-top:8px">'+
 link('Identity Proof',await docUrl(x.identity_proof_url))+link('PAN Proof',await docUrl(x.pan_proof_url))+link('Address Proof',await docUrl(x.address_proof_url))+link('Bank Proof',await docUrl(x.bank_proof_url))+link('Income Proof',await docUrl(x.income_proof_url))+link('Selfie',await docUrl(x.selfie_url))+
 '</div></div></div></div>';mb.innerHTML=old+extra;
}
window.viewApp=view;
})();