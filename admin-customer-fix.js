/* HELP FOR YOU — CUSTOMER/APPROVAL FIX ONLY. EMI SECTION UNTOUCHED. */
(function(){
'use strict';
function SB(){return window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);}
function val(id){var e=document.getElementById(id);return e&&typeof e.value==='string'?e.value.trim():'';}
function formValues(){
  var mb=document.getElementById('mb');
  var ins=mb?mb.querySelectorAll('input'):[];
  return {
    name: val('cn') || (ins[0]&&ins[0].value||'').trim(),
    mobile: val('cm') || (ins[1]&&ins[1].value||'').trim(),
    email: val('ce') || (ins[2]&&ins[2].value||'').trim(),
    dob: val('cd') || (ins[3]&&ins[3].value||'').trim(),
    pan: val('cp') || (ins[4]&&ins[4].value||'').trim(),
    aadhaar: val('ca') || (ins[5]&&ins[5].value||'').trim(),
    state: val('cs') || (ins[6]&&ins[6].value||'').trim(),
    district: val('cdist') || (ins[7]&&ins[7].value||'').trim(),
    pincode: val('cz') || (ins[8]&&ins[8].value||'').trim(),
    occupation: val('co') || (ins[9]&&ins[9].value||'').trim(),
    income: val('ci') || (ins[10]&&ins[10].value||'').trim(),
    address: val('caddr') || (ins[11]&&ins[11].value||'').trim()
  };
}
window.saveCustomer=async function(){
  var v=formValues();
  if(!v.name||!v.mobile)return alert('Name and Mobile are required');
  try{
    var r=await SB().rpc('hfy_admin_add_customer_application',{
      p_full_name:v.name,
      p_mobile:v.mobile,
      p_email:v.email||null,
      p_date_of_birth:v.dob||null,
      p_pan:v.pan||null,
      p_aadhaar:v.aadhaar||null,
      p_state:v.state||null,
      p_district:v.district||null,
      p_pincode:v.pincode||null,
      p_occupation:v.occupation||null,
      p_monthly_income:v.income?Number(v.income):null,
      p_address:v.address||null,
      p_requested_amount:0
    });
    if(r.error)throw r.error;
    if(window.loadData)await window.loadData();
    if(window.closeM)window.closeM();
    var approvalBtn=document.querySelector('.m[onclick*="approval"]');
    if(window.show&&approvalBtn)window.show('approval',approvalBtn);
    if(window.hfyApprovalRefresh)await window.hfyApprovalRefresh();
    alert('Customer saved successfully and sent to Approval.');
  }catch(e){
    console.error('Customer save:',e);
    alert('Customer save failed: '+(e.message||e));
  }
};
window.hfyApprovalRefresh=async function(){
  try{
    var r=await SB().from('loan_applications').select('*').order('created_at',{ascending:false});
    if(r.error)throw r.error;
    var rows=r.data||[];
    var body=document.getElementById('apRows');
    if(!body)return;
    var esc=function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
    var money=function(x){return Number(x||0).toFixed(2);};
    var pending=rows.map(function(x,i){
      var s=String(x.status||'pending').toLowerCase().trim();
      if(['approved','rejected','disbursed','active','completed','cancelled'].indexOf(s)>=0)return '';
      return '<tr><td>'+esc(x.name||x.full_name)+'</td><td>'+esc(x.mobile)+'</td><td>'+esc(x.created_at?x.created_at.slice(0,10):'')+'</td><td>₹'+money(x.requested_amount!=null?x.requested_amount:x.loan_amount)+'</td><td class="pending">Pending for Approval</td><td><button class="btn blue" onclick="editApproval('+i+')">Edit</button></td></tr>';
    }).join('');
    body.innerHTML=pending||'<tr><td colspan="6">No pending approval.</td></tr>';
  }catch(e){console.error('Approval refresh:',e);}
};
setTimeout(function(){window.hfyApprovalRefresh&&window.hfyApprovalRefresh();},1000);
})();
