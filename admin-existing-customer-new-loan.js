(()=>{ 
'use strict';
const escNew=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const sbNew=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const norm=v=>String(v??'').trim().toLowerCase();
const okStatus=(v,allowed)=>allowed.includes(norm(v));
const escAttr=v=>escNew(v).replace(/\n/g,' ');

window.hfyNewLoan=async function(mobile){
 try{
  const db=sbNew();
  const q=await db.from('customers').select('*').eq('mobile',mobile).maybeSingle();
  if(q.error)throw q.error;
  if(!q.data)return alert('Customer not found.');

  const c=q.data;
  const [loansRes,emisRes,appsRes]=await Promise.all([
   db.from('loan_accounts').select('id,loan_id,loan_amount,total_repayment,total_paid,remaining_amount,loan_status,start_date,end_date').eq('customer_id',c.id),
   db.from('loan_emi_schedule').select('id,loan_id,emi_number,due_date,emi_amount,penalty,paid_amount,remaining_amount,status').eq('customer_id',c.id),
   db.from('loan_applications').select('id,status,kyc_status,bank_verification,fraud_check,identity_proof_url,pan_proof_url,address_proof_url,bank_proof_url,income_proof_url,selfie_url,applied_at').eq('customer_id',c.id).order('applied_at',{ascending:false}).limit(10)
  ]);
  if(loansRes.error)throw loansRes.error;
  if(emisRes.error)throw emisRes.error;
  if(appsRes.error)throw appsRes.error;

  const loans=loansRes.data||[], emis=emisRes.data||[], apps=appsRes.data||[];
  const activeLoans=loans.filter(l=>!okStatus(l.loan_status,['closed','completed','settled','cancelled']) && Number(l.remaining_amount||0)>0);
  const overdue=emis.filter(e=>!okStatus(e.status,['paid','closed','completed']) && new Date(String(e.due_date)+'T23:59:59')<new Date());
  const latest=apps[0]||null;
  const latestDocs=latest?['identity_proof_url','pan_proof_url','address_proof_url','bank_proof_url','income_proof_url','selfie_url'].filter(k=>latest[k]):[];
  const kycVerified=okStatus(c.kyc_status,['verified','approved','complete','completed']);
  const customerActive=!['inactive','blocked','suspended','deleted'].includes(norm(c.status));
  const pendingApps=apps.filter(a=>['submitted','pending','under_review','review','approved'].includes(norm(a.status)));
  const reasons=[];
  if(!customerActive)reasons.push('Customer status is '+(c.status||'not active'));
  if(!kycVerified)reasons.push('KYC is not verified');
  if(activeLoans.length)reasons.push(activeLoans.length+' active loan(s) with outstanding amount');
  if(overdue.length)reasons.push(overdue.length+' overdue unpaid EMI(s)');
  if(pendingApps.length)reasons.push(pendingApps.length+' existing application(s) still under process');
  const canApply=reasons.length===0;

  const badge=(good,text)=>'<span style="display:inline-block;padding:4px 8px;border-radius:12px;background:'+(good?'#e5f7ee':'#ffe9e9')+';color:'+(good?'#08733f':'#a50000')+';font-weight:700">'+escNew(text)+'</span>';
  let loanHtml=loans.length?loans.map(l=>'<tr><td>'+escNew(l.loan_id)+'</td><td>'+escNew(l.loan_status)+'</td><td>₹'+Number(l.remaining_amount||0).toFixed(2)+'</td></tr>').join(''):'<tr><td colspan="3">No previous loan found</td></tr>';

  window.openBox('Existing Customer Verification',
   '<p>Customer: <b>'+escNew(c.full_name)+'</b><br>Mobile: <b>'+escNew(c.mobile)+'</b><br>Customer ID: <b>'+escNew(c.id)+'</b></p>'+
   '<div style="background:#f5f8fc;padding:12px;border-radius:10px;margin:10px 0">'+
   '<p><b>KYC:</b> '+badge(kycVerified,c.kyc_status||'Not verified')+'</p>'+
   '<p><b>Customer Status:</b> '+badge(customerActive,c.status||'Unknown')+'</p>'+
   '<p><b>Active Loan:</b> '+badge(!activeLoans.length,activeLoans.length?activeLoans.length+' found':'None')+'</p>'+
   '<p><b>Overdue EMI:</b> '+badge(!overdue.length,overdue.length?overdue.length+' found':'None')+'</p>'+
   '<p><b>Pending Application:</b> '+badge(!pendingApps.length,pendingApps.length?pendingApps.length+' found':'None')+'</p>'+
   '</div>'+
   (latest?'<p><b>Latest Application:</b> #'+escNew(latest.id)+' — '+escNew(latest.status)+' | Documents uploaded: '+latestDocs.length+'/6</p>':'<p><b>Previous Application:</b> Not found</p>')+
   '<h4>Loan History</h4><div class="wrap"><table><thead><tr><th>Loan ID</th><th>Status</th><th>Outstanding</th></tr></thead><tbody>'+loanHtml+'</tbody></table></div>'+
   (canApply?
    '<div style="margin-top:14px;background:#e5f7ee;padding:10px;border-radius:8px;color:#08733f"><b>Verification Passed.</b> Existing customer can submit a new loan application.</div>'+
    '<div class="form" style="margin-top:12px"><label>Loan Amount<input id="newLoanAmount" type="number" min="1000" max="20000" value="5000"></label><label>Loan Tenure<select id="newLoanTenure"><option value="1">1 Month</option><option value="2">2 Months</option><option value="3">3 Months</option></select></label><label class="full">Remarks<input id="newLoanRemarks" placeholder="Optional"></label><div class="full"><button class="btn green" onclick="submitExistingNewLoan('+Number(c.id)+')">Create New Loan Application</button></div></div>'
    :
    '<div style="margin-top:14px;background:#ffe9e9;padding:10px;border-radius:8px;color:#a50000"><b>Verification Failed.</b><br>'+reasons.map(escNew).join('<br>')+'</div>'
   )
  );
 }catch(e){console.error(e);alert('Existing customer verification failed: '+(e?.message||e));}
};

window.submitExistingNewLoan=async function(customerId){
 try{
  const amount=Number(document.getElementById('newLoanAmount')?.value||0);
  const tenure=Number(document.getElementById('newLoanTenure')?.value||1);
  const remarks=document.getElementById('newLoanRemarks')?.value||null;
  if(amount<1000||amount>20000)return alert('Loan amount must be ₹1,000 to ₹20,000.');

  const db=sbNew();
  const c=await db.from('customers').select('*').eq('id',customerId).single();
  if(c.error)throw c.error;
  const x=c.data;

  const [loansRes,emisRes,appsRes]=await Promise.all([
   db.from('loan_accounts').select('id,loan_status,remaining_amount').eq('customer_id',x.id),
   db.from('loan_emi_schedule').select('id,due_date,status,remaining_amount').eq('customer_id',x.id),
   db.from('loan_applications').select('id,status,applied_at').eq('customer_id',x.id).order('applied_at',{ascending:false}).limit(20)
  ]);
  if(loansRes.error)throw loansRes.error;
  if(emisRes.error)throw emisRes.error;
  if(appsRes.error)throw appsRes.error;

  const active=(loansRes.data||[]).filter(l=>!okStatus(l.loan_status,['closed','completed','settled','cancelled'])&&Number(l.remaining_amount||0)>0);
  const overdue=(emisRes.data||[]).filter(e=>!okStatus(e.status,['paid','closed','completed'])&&new Date(String(e.due_date)+'T23:59:59')<new Date());
  const pending=(appsRes.data||[]).filter(a=>['submitted','pending','under_review','review','approved'].includes(norm(a.status)));

  if(!okStatus(x.kyc_status,['verified','approved','complete','completed']))return alert('New loan blocked: KYC is not verified.');
  if(['inactive','blocked','suspended','deleted'].includes(norm(x.status)))return alert('New loan blocked: customer status is '+x.status+'.');
  if(active.length)return alert('New loan blocked: customer has an active loan with outstanding amount.');
  if(overdue.length)return alert('New loan blocked: customer has overdue unpaid EMI(s).');
  if(pending.length)return alert('New loan blocked: an existing application is already under process.');

  const r=await db.from('loan_applications').insert({
   customer_id:x.id,full_name:x.full_name,mobile:x.mobile,email:x.email,date_of_birth:x.date_of_birth,
   gender:x.gender,occupation:x.occupation,monthly_income:x.monthly_income,address:x.address,city:x.city,
   district:x.district,state:x.state,pincode:x.pincode,pan_number:x.pan_number,aadhaar_number:x.aadhaar_number,
   kyc_status:x.kyc_status,bank_verification:x.bank_verification||'Pending',fraud_check:x.fraud_check||'Pending',
   requested_amount:amount,tenure_months:tenure,status:'submitted',admin_remarks:remarks
  }).select('id').single();
  if(r.error)throw r.error;
  if(typeof closeM==='function')closeM();
  if(typeof window.loadData==='function')await window.loadData();
  alert('New loan application created successfully. It will appear in Approval.');
 }catch(e){console.error(e);alert('New loan application failed: '+(e?.message||e));}
};

function addButtons(){
 const body=document.getElementById('cuRows'); if(!body)return;
 body.querySelectorAll('tr').forEach(tr=>{
  if(tr.dataset.newLoanAdded)return;
  const cells=tr.querySelectorAll('td'); if(cells.length<6)return;
  const mobile=(cells[1].textContent||'').trim(); if(!mobile)return;
  const td=cells[5];
  const b=document.createElement('button'); b.className='btn green'; b.textContent='New Loan'; b.onclick=()=>window.hfyNewLoan(mobile);
  td.appendChild(b); tr.dataset.newLoanAdded='1';
 });
}
const obs=new MutationObserver(addButtons); obs.observe(document.body,{childList:true,subtree:true});
setTimeout(addButtons,500);
})();