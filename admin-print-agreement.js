(()=>{
'use strict';
const escA=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const dbA=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
window.hfyPrintAgreements=async function(){
 try{
  const db=dbA();
  const r=await db.from('loan_applications').select('*').eq('status','approved').order('id',{ascending:false});
  if(r.error)throw r.error;
  const rows=r.data||[];
  let h='<h3>Approved Customers — Print Agreement</h3><div class="wrap"><table><thead><tr><th>Name</th><th>Mobile</th><th>Loan ID</th><th>Approved Amount</th><th>Sanction Date</th><th>Action</th></tr></thead><tbody>';
  rows.forEach(x=>{h+=`<tr><td>${escA(x.full_name)}</td><td>${escA(x.mobile)}</td><td>${escA(x.loan_id||x.loan_account_id||'')}</td><td>₹${Number(x.approved_amount||x.requested_amount||0).toFixed(2)}</td><td>${escA(x.sanction_date||'')}</td><td><button class="btn blue" onclick="hfyOpenAgreement(${Number(x.id)})">Print Agreement</button></td></tr>`});
  h+='</tbody></table></div>'; window.openBox('Print Agreement',h);
 }catch(e){console.error(e);alert('Agreement list error: '+(e?.message||e));}
};
window.hfyOpenAgreement=async function(id){
 try{
  const db=dbA(); const r=await db.from('loan_applications').select('*').eq('id',id).single(); if(r.error)throw r.error; const x=r.data;
  const fields=[['Full Name','full_name'],['Father / Mother Name','father_mother_name'],['Date of Birth','date_of_birth'],['Gender','gender'],['Mobile Number','mobile'],['Email','email'],['House / Door No.','house_no'],['Street / Locality','street'],['Village / Town','village'],['Post Office','post_office'],['District','district'],['State','state'],['PIN Code','pincode'],['Full Address','address'],['Loan ID','loan_id'],['Loan Amount','approved_amount'],['Interest Rate %','interest_rate'],['Tenure Months','tenure_months'],['EMI Amount','emi_amount'],['Daily EMI','daily_emi'],['Total Interest','total_interest'],['Total Repayment','total_repayment'],['Loan Purpose','loan_purpose'],['Occupation / Business','occupation'],['Monthly Income','monthly_income'],['Apply Date','apply_date'],['Sanction Date','sanction_date'],['PAN Number','pan_number'],['Aadhaar Number','aadhaar_number'],['Bank Account Number','bank_account_number'],['IFSC Code','ifsc_code']];
  let h='<p>Edit any agreement detail before printing.</p><div class="form">'; fields.forEach(([label,key])=>{let v=x[key]??''; let type=/date/i.test(key)?'date':(/amount|income|interest|tenure|emi|pincode/i.test(key)?'text':'text'); h+=`<label>${escA(label)}<input id="agr_${escA(key)}" type="${type}" value="${escA(v)}"></label>`}); h+='</div><div class="actions"><button class="btn blue" onclick="hfyPrintAgreementWindow('+Number(id)+')">Print Agreement</button></div>'; window.openBox('Loan Agreement — Approved Customer',h);
 }catch(e){console.error(e);alert('Agreement error: '+(e?.message||e));}
};
window.hfyPrintAgreementWindow=function(id){
 const keys=['full_name','father_mother_name','date_of_birth','gender','mobile','email','house_no','street','village','post_office','district','state','pincode','address','loan_id','approved_amount','interest_rate','tenure_months','emi_amount','daily_emi','total_interest','total_repayment','loan_purpose','occupation','monthly_income','apply_date','sanction_date','pan_number','aadhaar_number','bank_account_number','ifsc_code'];
 const labels=['Full Name','Father / Mother Name','Date of Birth','Gender','Mobile Number','Email','House / Door No.','Street / Locality','Village / Town','Post Office','District','State','PIN Code','Full Address','Loan ID','Loan Amount','Interest Rate %','Tenure Months','EMI Amount','Daily EMI','Total Interest','Total Repayment','Loan Purpose','Occupation / Business','Monthly Income','Apply Date','Sanction Date','PAN Number','Aadhaar Number','Bank Account Number','IFSC Code'];
 let rows=''; keys.forEach((k,i)=>{const el=document.getElementById('agr_'+k); rows+=`<tr><th>${escA(labels[i])}</th><td>${escA(el?el.value:'')}</td></tr>`});
 const w=window.open('','_blank'); if(!w)return alert('Please allow pop-ups to print the agreement.'); w.document.write(`<!doctype html><html><head><title>HELP FOR YOU - Loan Agreement</title><style>body{font-family:Arial;padding:30px;color:#111}h1,h2{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:8px;text-align:left}th{width:35%}.sign{margin-top:70px;display:flex;justify-content:space-between}.line{border-top:1px solid #111;width:220px;text-align:center;padding-top:8px}@media print{button{display:none}}</style></head><body><h1>HELP FOR YOU</h1><h2>LOAN AGREEMENT</h2><p><b>Agreement for Approved Loan</b></p><table>${rows}</table><h3>Declaration</h3><p>I confirm that the information stated above is correct and agree to repay the approved loan according to the applicable repayment schedule and terms.</p><div class="sign"><div class="line">Borrower Signature</div><div class="line">Authorised Officer / Admin</div></div><script>window.onload=()=>window.print()<\/script></body></html>`); w.document.close();
};
const oldShow=window.show; window.show=function(id,el){if(typeof oldShow==='function')oldShow(id,el); if(id==='reports'){setTimeout(()=>{const p=document.getElementById('reports'); if(p&&!document.getElementById('agreementBtn')){const b=document.createElement('button');b.id='agreementBtn';b.className='btn blue';b.textContent='🖨️ Print Agreement';b.onclick=window.hfyPrintAgreements;p.appendChild(b)}},100)}};
})();
