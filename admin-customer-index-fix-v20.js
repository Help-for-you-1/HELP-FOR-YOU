(()=>{
'use strict';
const sb=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const oldEditCustomer=window.editCustomer;
if(typeof oldEditCustomer==='function'){
  window.editCustomer=async function(displayIndex){
    try{
      const q=await sb().from('customers').select('*').order('created_at',{ascending:false});
      if(q.error)throw q.error;
      const term=(document.getElementById('search')?.value||'').toLowerCase();
      const visible=(q.data||[]).filter(x=>(String(x.full_name||'')+' '+String(x.mobile||'')).toLowerCase().includes(term));
      const customer=visible[Number(displayIndex)];
      if(!customer)return alert('Customer not found.');
      const actualIndex=(q.data||[]).findIndex(x=>String(x.id)===String(customer.id));
      if(actualIndex<0)return alert('Customer not found.');
      return oldEditCustomer(actualIndex);
    }catch(e){console.error(e);alert('Customer edit error: '+(e?.message||e));}
  };
}

// This is loaded before the KYC script, so keep checking and replace its save handlers
// after that script loads. No loan_applications.sanction_date is ever written.
let installed=false;
function installSchemaSafeSaves(){
  if(installed || typeof window.saveCustomerFull!=='function')return;
  installed=true;
  window.saveCustomerFull=async(cid,aid)=>{
    try{
      const g=k=>document.getElementById(k)?.value??null;
      const cp={full_name:g('cus_full_name'),mobile:g('cus_mobile'),email:g('cus_email')||null,date_of_birth:g('cus_dob')||null,gender:g('cus_gender'),address:g('cedAddress'),district:g('cus_district'),state:g('cus_state'),pincode:g('cus_pincode'),pan_number:g('cus_pan'),aadhaar_number:g('cus_aadhaar'),occupation:g('cus_occupation'),monthly_income:Number(g('cus_income')||0)||null,kyc_status:g('cusKyc')};
      let r=await sb().from('customers').update(cp).eq('id',cid);
      if(r.error)throw r.error;
      if(aid){
        const ap={full_name:cp.full_name,mobile:cp.mobile,email:cp.email,date_of_birth:cp.date_of_birth,gender:cp.gender,address:cp.address,district:cp.district,state:cp.state,pincode:cp.pincode,pan_number:cp.pan_number,aadhaar_number:cp.aadhaar_number,occupation:cp.occupation,monthly_income:cp.monthly_income,requested_amount:Number(g('cus_requested')||0),approved_amount:Number(g('cus_approved')||0),interest_rate:Number(g('cus_interest')||0),tenure_months:Number(g('cus_tenure')||1),emi_amount:Number(g('cus_emi')||0),daily_emi:Number(g('cus_daily_emi')||0),total_interest:Number(g('cus_total_interest')||0),total_repayment:Number(g('cus_total_repayment')||0),loan_purpose:g('cus_purpose'),bank_account:g('cus_bank_account'),ifsc_code:g('cus_ifsc'),applied_at:g('cus_apply_date')||null,status:g('cus_app_status'),bank_verification:g('cus_bank_verification'),fraud_check:g('cus_fraud_check'),kyc_status:cp.kyc_status,admin_remarks:g('cusKycRemarks')};
        r=await sb().from('loan_applications').update(ap).eq('id',aid);
        if(r.error)throw r.error;
        const l=await sb().from('loan_accounts').select('id').eq('application_id',aid).maybeSingle();
        if(l.error)throw l.error;
        if(l.data){
          const sanction=g('cus_sanction_date');
          const lp={loan_amount:ap.approved_amount||ap.requested_amount,total_repayment:ap.total_repayment,tenure_months:ap.tenure_months,daily_emi:ap.daily_emi,start_date:sanction||null};
          r=await sb().from('loan_accounts').update(lp).eq('id',l.data.id);
          if(r.error)throw r.error;
        }
      }
      if(window.closeM)window.closeM();
      if(window.loadData)await window.loadData();
      alert('Customer and application updated successfully.');
    }catch(e){console.error(e);alert('Customer update error: '+(e?.message||e));}
  };
  window.saveApplicationFull=async id=>{
    try{
      const g=k=>document.getElementById(k)?.value??null;
      const p={full_name:g('app_full_name'),parent_name:g('app_parent_name'),date_of_birth:g('app_date_of_birth')||null,gender:g('app_gender'),mobile:g('app_mobile'),email:g('app_email')||null,house:g('app_house'),street:g('app_street'),village:g('app_village'),post_office:g('app_post_office'),district:g('app_district'),state:g('app_state'),pincode:g('app_pincode'),address:g('app_address'),requested_amount:Number(g('app_requested_amount')||0),approved_amount:Number(g('app_approved_amount')||0),interest_rate:Number(g('app_interest_rate')||0),tenure_months:Number(g('app_tenure_months')||1),emi_amount:Number(g('app_emi_amount')||0),daily_emi:Number(g('app_daily_emi')||0),total_interest:Number(g('app_total_interest')||0),total_repayment:Number(g('app_total_repayment')||0),loan_purpose:g('app_loan_purpose'),occupation:g('app_occupation'),monthly_income:Number(g('app_monthly_income')||0)||null,applied_at:g('app_applied_at')||null,pan_number:g('app_pan_number'),aadhaar_number:g('app_aadhaar_number'),bank_account:g('app_bank_account'),ifsc_code:g('app_ifsc_code'),kyc_status:g('appKycStatus'),status:g('app_status'),bank_verification:g('app_bank_verification'),fraud_check:g('app_fraud_check'),admin_remarks:g('appKycRemarks')};
      let r=await sb().from('loan_applications').update(p).eq('id',id);
      if(r.error)throw r.error;
      const q=await sb().from('loan_applications').select('customer_id').eq('id',id).maybeSingle();
      if(q.error)throw q.error;
      if(q.data?.customer_id){
        r=await sb().from('customers').update({full_name:p.full_name,mobile:p.mobile,email:p.email,date_of_birth:p.date_of_birth,gender:p.gender,address:p.address,district:p.district,state:p.state,pincode:p.pincode,pan_number:p.pan_number,aadhaar_number:p.aadhaar_number,occupation:p.occupation,monthly_income:p.monthly_income,kyc_status:p.kyc_status}).eq('id',q.data.customer_id);
        if(r.error)throw r.error;
      }
      const l=await sb().from('loan_accounts').select('id').eq('application_id',id).maybeSingle();
      if(l.error)throw l.error;
      if(l.data){
        const sanction=g('app_sanction_date');
        r=await sb().from('loan_accounts').update({loan_amount:p.approved_amount||p.requested_amount,total_repayment:p.total_repayment,tenure_months:p.tenure_months,daily_emi:p.daily_emi,start_date:sanction||null}).eq('id',l.data.id);
        if(r.error)throw r.error;
      }
      if(window.closeM)window.closeM();
      if(window.loadData)await window.loadData();
      alert('Full application updated successfully.');
    }catch(e){console.error(e);alert('Application update error: '+(e?.message||e));}
  };
}
setInterval(installSchemaSafeSaves,250);
setTimeout(installSchemaSafeSaves,2000);
})();