(()=>{
'use strict';
const escNew=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const sbNew=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
window.hfyNewLoan=async function(mobile){
 try{
  const db=sbNew();
  const q=await db.from('customers').select('*').eq('mobile',mobile).maybeSingle();
  if(q.error)throw q.error;
  if(!q.data)return alert('Customer not found.');
  const c=q.data;
  window.openBox('New Loan — Existing Customer',`<p>Customer: <b>${escNew(c.full_name)}</b></p><p>Mobile: <b>${escNew(c.mobile)}</b></p><div class="form"><label>Loan Amount<input id="newLoanAmount" type="number" min="1000" max="20000" value="5000"></label><label>Loan Tenure<select id="newLoanTenure"><option value="1">1 Month</option><option value="2">2 Months</option><option value="3">3 Months</option></select></label><label class="full">Remarks<input id="newLoanRemarks" placeholder="Optional"></label><div class="full"><button class="btn green" onclick="submitExistingNewLoan('${escNew(c.id)}')">Create New Loan Application</button></div></div>`);
 }catch(e){console.error(e);alert('New loan error: '+(e?.message||e));}
};
window.submitExistingNewLoan=async function(customerId){
 try{
  const amount=Number(document.getElementById('newLoanAmount').value||0), tenure=Number(document.getElementById('newLoanTenure').value||1), remarks=document.getElementById('newLoanRemarks').value||null;
  if(amount<1000||amount>20000)return alert('Loan amount must be ₹1,000 to ₹20,000.');
  const db=sbNew();
  const c=await db.from('customers').select('*').eq('id',customerId).single();
  if(c.error)throw c.error;
  const x=c.data;
  const r=await db.from('loan_applications').insert({customer_id:x.id,full_name:x.full_name,mobile:x.mobile,email:x.email,date_of_birth:x.date_of_birth,occupation:x.occupation,monthly_income:x.monthly_income,address:x.address,district:x.district,state:x.state,pincode:x.pincode,pan_number:x.pan_number,aadhaar_number:x.aadhaar_number,kyc_status:x.kyc_status||'Pending',bank_verification:'Pending',fraud_check:'Pending',requested_amount:amount,tenure_months:tenure,status:'submitted',admin_remarks:remarks}).select('id').single();
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
  const b=document.createElement('button'); b.className='btn green'; b.textContent='New Loan'; b.onclick=()=>window.hfyNewLoan(mobile); td.appendChild(b);
  tr.dataset.newLoanAdded='1';
 });
}
const obs=new MutationObserver(addButtons); obs.observe(document.body,{childList:true,subtree:true});
setTimeout(addButtons,500);
})();
