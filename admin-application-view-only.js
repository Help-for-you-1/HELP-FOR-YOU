/* HELP FOR YOU — Application View only */
(()=>{
'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function link(label,url){
 const u=String(url||'').trim();
 return u ? '<a href="'+esc(u)+'" target="_blank" rel="noopener" style="display:inline-block;margin:4px 6px 4px 0">View '+esc(label)+'</a>' : '<span style="color:#888;margin-right:10px">'+esc(label)+': Not uploaded</span>';
}
function view(i){
 const rows=window.__HFY_APPLICATIONS||[],x=rows[Number(i)];
 if(!x){alert('Application not found.');return;}
 if(typeof window.editApproval!=='function'){alert('Application editor is unavailable.');return;}
 window.editApproval(Number(i));
 const mb=document.getElementById('mb');
 if(!mb)return;
 const customers=window.__HFY_CUSTOMERS||[];
 const c=customers.find(v=>String(v.id)===String(x.customer_id))||{};
 const old=mb.innerHTML;
 const extra=
 '<div style="margin-top:14px;padding:12px;border:1px solid #ddd;border-radius:10px">'+
 '<h3 style="margin:0 0 10px">Additional Application Details</h3>'+
 '<div class="form">'+
 '<label>Customer Code<input value="'+esc(c.customer_code||'')+'" readonly></label>'+
 '<label>Applied Date<input value="'+esc(x.applied_at||'')+'" readonly></label>'+
 '<label>Created At<input value="'+esc(x.created_at||'')+'" readonly></label>'+
 '<label>Updated At<input value="'+esc(x.updated_at||'')+'" readonly></label>'+
 '<label class="full">Staff Remarks<textarea readonly>'+esc(c.staff_remarks||x.staff_remarks||'')+'</textarea></label>'+
 '<div class="full"><b>KYC / Uploaded Documents</b><div style="margin-top:8px">'+
 link('Identity Proof',x.identity_proof_url)+
 link('PAN Proof',x.pan_proof_url)+
 link('Address Proof',x.address_proof_url)+
 link('Bank Proof',x.bank_proof_url)+
 link('Income Proof',x.income_proof_url)+
 link('Selfie',x.selfie_url)+
 '</div></div></div></div>';
 mb.innerHTML=old+extra;
}
window.viewApp=view;
})();