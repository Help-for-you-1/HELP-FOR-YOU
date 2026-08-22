/* HELP FOR YOU — CUSTOMER/APPROVAL FIX ONLY. EMI SECTION UNTOUCHED. */
(function(){
'use strict';
function SB(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
function g(id){var e=document.getElementById(id);return e?e.value.trim():'';}
window.saveCustomer=async function(){
  var name=g('cn'), mobile=g('cm');
  if(!name||!mobile)return alert('Name and Mobile are required');
  try{
    var r=await SB().rpc('hfy_admin_add_customer_application',{
      p_full_name:name,
      p_mobile:mobile,
      p_email:g('ce')||null,
      p_date_of_birth:g('cd')||null,
      p_pan:g('cp')||null,
      p_aadhaar:g('ca')||null,
      p_state:g('cs')||null,
      p_district:g('cdist')||null,
      p_pincode:g('cz')||null,
      p_occupation:g('co')||null,
      p_monthly_income:g('ci')?Number(g('ci')):null,
      p_address:g('caddr')||null,
      p_requested_amount:Number(g('cLoanAmount')||g('loanAmount')||0)
    });
    if(r.error)throw r.error;
    if(window.closeM)window.closeM();
    if(window.loadData)await window.loadData();
    if(window.show){var b=document.querySelector('.m[onclick*="approval"]');window.show('approval',b||document.querySelector('.m'));}
    alert('Customer saved successfully and sent to Approval.');
  }catch(e){
    console.error(e);
    alert('Customer save failed: '+(e.message||e));
  }
};
})();
