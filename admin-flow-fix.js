/* HELP FOR YOU — CUSTOMER -> APPLICATION -> APPROVAL -> CUSTOMER/EMI FLOW FIX ONLY.
   Existing EMI UI is intentionally untouched. */
(function(){
'use strict';
function client(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
function v(id){var e=document.getElementById(id);return e&&typeof e.value==='string'?e.value.trim():'';}
function values(){
  var mb=document.getElementById('mb'), ins=mb?mb.querySelectorAll('input'):[];
  return {
    name:v('cn')||(ins[0]&&ins[0].value||'').trim(), mobile:v('cm')||(ins[1]&&ins[1].value||'').trim(),
    email:v('ce')||(ins[2]&&ins[2].value||'').trim(), dob:v('cd')||(ins[3]&&ins[3].value||'').trim(),
    pan:v('cp')||(ins[4]&&ins[4].value||'').trim(), aadhaar:v('ca')||(ins[5]&&ins[5].value||'').trim(),
    state:v('cs')||(ins[6]&&ins[6].value||'').trim(), district:v('cdist')||(ins[7]&&ins[7].value||'').trim(),
    pincode:v('cz')||(ins[8]&&ins[8].value||'').trim(), occupation:v('co')||(ins[9]&&ins[9].value||'').trim(),
    income:v('ci')||(ins[10]&&ins[10].value||'').trim(), address:v('caddr')||(ins[11]&&ins[11].value||'').trim()
  };
}
window.saveCustomer=async function(){
  var x=values(); if(!x.name||!x.mobile)return alert('Name and Mobile are required');
  try{
    var s=client();
    var c=await s.from('customers').insert({full_name:x.name,mobile:x.mobile,email:x.email||null,date_of_birth:x.dob||null,pan_number:x.pan||null,aadhaar_number:x.aadhaar||null,state:x.state||null,district:x.district||null,pincode:x.pincode||null,occupation:x.occupation||null,monthly_income:x.income?Number(x.income):null,address:x.address||null,status:'active',kyc_status:'Pending'}).select('id').single();
    if(c.error)throw c.error;
    var a=await s.from('loan_applications').insert({customer_id:c.data.id,name:x.name,full_name:x.name,mobile:x.mobile,email:x.email||null,date_of_birth:x.dob||null,pan_number:x.pan||null,aadhaar_number:x.aadhaar||null,state:x.state||null,city:x.district||null,pincode:x.pincode||null,occupation:x.occupation||null,monthly_income:x.income?Number(x.income):null,address:x.address||null,requested_amount:0,loan_amount:0,status:'submitted',kyc_status:'Pending',bank_verification:'Pending',fraud_check:'Pending'}).select('id').single();
    if(a.error)throw a.error;
    if(window.closeM)window.closeM();
    if(window.loadData)await window.loadData();
    alert('Customer saved and loan application sent to Approval.');
  }catch(e){console.error(e);alert('Customer/Application save failed: '+(e.message||e));}
};
window.approve=async function(i){
  var x=db.applications[i], a=Number(v('ea')), m=typeof plan==='function'?plan(a):0;
  if(!m)return alert('Loan amount must be ₹1,000 to ₹20,000');
  var t=a+a*.2*m, daily=t/(m*30), s=client();
  try{
    var cid=x.customer_id;
    if(!cid){
      var nc=await s.from('customers').insert({full_name:v('en'),mobile:v('em'),email:v('ee')||null,address:v('ead')||null,pan_number:v('epan')||null,aadhaar_number:v('eaad')||null,state:v('estate')||null,district:v('edistrict')||null,pincode:v('epin')||null,kyc_status:v('ek')||'Pending',status:'active'}).select('id').single();
      if(nc.error)throw nc.error; cid=nc.data.id;
    } else {
      var uc=await s.from('customers').update({full_name:v('en'),mobile:v('em'),email:v('ee')||null,address:v('ead')||null,pan_number:v('epan')||null,aadhaar_number:v('eaad')||null,state:v('estate')||null,district:v('edistrict')||null,pincode:v('epin')||null,kyc_status:v('ek')||'Pending',status:'active'}).eq('id',cid);
      if(uc.error)throw uc.error;
    }
    var ua=await s.from('loan_applications').update({customer_id:cid,name:v('en'),full_name:v('en'),mobile:v('em'),requested_amount:a,approved_amount:a,loan_amount:a,interest_rate:20,tenure:m,tenure_months:m,emi_amount:t/m,daily_emi:daily,total_interest:a*.2*m,total_repayment:t,kyc_status:v('ek')||'Pending',address:v('ead'),status:'approved',updated_at:new Date().toISOString()}).eq('id',x.id);
    if(ua.error)throw ua.error;
    var last=await s.from('loan_accounts').select('loan_id').order('loan_id',{ascending:false}).limit(1); if(last.error)throw last.error;
    var lid=(last.data&&last.data[0]?Number(last.data[0].loan_id):0)+1;
    var sd=v('edate')||x.sanction_date||new Date().toISOString().slice(0,10), end=new Date(sd+'T00:00:00'); end.setDate(end.getDate()+m*30);
    var la=await s.from('loan_accounts').insert({loan_id:lid,customer_id:cid,loan_amount:a,total_repayment:t,tenure_months:m,daily_emi:daily,total_paid:0,remaining_amount:t,penalty_amount:0,loan_status:'active',start_date:sd,end_date:end.toISOString().slice(0,10),application_id:x.id}).select('id').single();
    if(la.error)throw la.error;
    var rows=[]; for(var n=1;n<=m*30;n++){var d=new Date(sd+'T00:00:00');d.setDate(d.getDate()+n);rows.push({loan_account_id:la.data.id,loan_id:lid,customer_id:cid,emi_number:n,due_date:d.toISOString().slice(0,10),emi_amount:daily,penalty:0,paid_amount:0,status:'upcoming'});}
    var er=await s.from('loan_emi_schedule').insert(rows); if(er.error)throw er.error;
    if(window.closeM)window.closeM(); await window.loadData(); alert('Approved. Loan ID: '+lid);
  }catch(e){console.error(e);alert('Approval failed: '+(e.message||e));}
};
})();
