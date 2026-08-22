// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = 'https://bvyruwvvlubgqficjblq.supabase.co';
window.HFY_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47c';

(function () {
  if (!window.supabase || !window.HFY_SUPABASE_URL || !window.HFY_SUPABASE_PUBLISHABLE_KEY) return;
  const client = window.supabase.createClient(window.HFY_SUPABASE_URL, window.HFY_SUPABASE_PUBLISHABLE_KEY);
  window.hfySupabase = client;
  if (location.pathname.toLowerCase().endsWith('/admin.html')) {
    (async function guardAdmin() {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!session) { location.replace('login.html'); return; }
        const { data: ok, error } = await client.rpc('is_admin');
        if (error || !ok) { await client.auth.signOut(); sessionStorage.removeItem('hfy_admin'); location.replace('login.html'); return; }
        sessionStorage.setItem('hfy_admin', 'true');
      } catch (e) { console.error('Admin session check failed', e); location.replace('login.html'); }
    })();
    setTimeout(function fixApprovalIndex() {
      try {
        if (!window.apRows || typeof window.editApproval !== 'function') return;
        const pending = (window.db?.applications || []).map((x,index)=>({x,index})).filter(({x})=>!['approved','rejected','disbursed'].includes(String(x.status||'').toLowerCase()));
        window.apRows.innerHTML = pending.map(({x,index})=>`<tr><td>${esc(x.name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.date)}</td><td>₹${money(x.amount)}</td><td class="pending">Pending for Approval</td><td><button class="btn blue" onclick="editApproval(${index})">Edit</button></td></tr>`).join('') || '<tr><td colspan="6">No pending approval.</td></tr>';
      } catch(e){console.error('Approval index fix failed',e);}
    },1200);
  }
})();
(function () {
  function bootAddCustomer() {
    if (!location.pathname.toLowerCase().endsWith('/admin.html')) return;
    if (!window.supabase || !window.HFY_SUPABASE_URL || !window.HFY_SUPABASE_PUBLISHABLE_KEY) return;
    if (document.getElementById('hfyAddCustomerBtn')) return;
    const section=document.getElementById('customers');
    if(!section){setTimeout(bootAddCustomer,300);return;}
    const btn=document.createElement('button');btn.id='hfyAddCustomerBtn';btn.className='btn blue';btn.textContent='+ Add Customer';btn.style.marginBottom='12px';btn.onclick=openAddCustomer;section.insertBefore(btn,section.firstChild.nextSibling);
    window.openAddCustomer=function(){if(typeof openBox!=='function')return;openBox('Add Customer',`<div class="form">
      <label>Full Name<input id="acName" autocomplete="name" required></label><label>Mobile Number<input id="acMobile" inputmode="tel" maxlength="15" required></label><label>Email<input id="acEmail" type="email"></label><label>Date of Birth<input id="acDob" type="date"></label><label>Gender<select id="acGender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Occupation<input id="acOccupation"></label><label>Monthly Income<input id="acIncome" type="number" min="0"></label><label>PAN Number<input id="acPan" maxlength="10" style="text-transform:uppercase"></label><label>Aadhaar Number<input id="acAadhaar" inputmode="numeric" maxlength="12"></label><label>State<input id="acState"></label><label>District<input id="acDistrict"></label><label>Pincode<input id="acPincode" inputmode="numeric" maxlength="6"></label><label class="full">Address<input id="acAddress"></label><div class="full"><button class="btn green" onclick="saveNewCustomer()">Save Customer</button><button class="btn gray" onclick="closeM()">Cancel</button></div></div>`);};
    window.saveNewCustomer=async function(){
      const name=document.getElementById('acName').value.trim(),mobile=document.getElementById('acMobile').value.trim();
      if(!name||!mobile){alert('Name and Mobile Number are required.');return;}
      const btnSave=document.querySelector('#mb .green');if(btnSave){btnSave.disabled=true;btnSave.textContent='Saving...';}
      const code='CUST-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
      const row={customer_code:code,full_name:name,mobile,email:document.getElementById('acEmail').value.trim()||null,date_of_birth:document.getElementById('acDob').value||null,gender:document.getElementById('acGender').value||null,occupation:document.getElementById('acOccupation').value.trim()||null,monthly_income:document.getElementById('acIncome').value?Number(document.getElementById('acIncome').value):null,pan_number:document.getElementById('acPan').value.trim().toUpperCase()||null,aadhaar_number:document.getElementById('acAadhaar').value.trim()||null,state:document.getElementById('acState').value.trim()||null,district:document.getElementById('acDistrict').value.trim()||null,pincode:document.getElementById('acPincode').value.trim()||null,address:document.getElementById('acAddress').value.trim()||null,kyc_status:'Pending',status:'active',account_status:'active'};
      const {data,error}=await client.from('customers').insert(row).select('*').single();
      if(error){console.error('Add customer failed',error);alert('Customer save failed: '+error.message);if(btnSave){btnSave.disabled=false;btnSave.textContent='Save Customer';}return;}
      // An admin-created customer is also a loan application. It starts in submitted status
      // so it appears in both All Applications and Approval until the admin approves/rejects it.
      const app={customer_id:data.id,full_name:name,name,mobile,email:row.email,address:row.address,date_of_birth:row.date_of_birth,gender:row.gender,occupation:row.occupation,monthly_income:row.monthly_income,pan_number:row.pan_number,aadhaar_number:row.aadhaar_number,status:'submitted',kyc_status:'Pending',requested_amount:null,updated_at:new Date().toISOString()};
      const {error:appError}=await client.from('loan_applications').insert(app);
      if(appError){console.error('Application creation failed',appError);alert('Customer saved, but application creation failed: '+appError.message);if(typeof loadData==='function')await loadData();closeM();return;}
      if(typeof loadData==='function')await loadData();
      closeM();
      alert('Customer added successfully and sent to All Applications + Approval. Customer ID: '+data.id+'\nCustomer Code: '+data.customer_code);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootAddCustomer);else setTimeout(bootAddCustomer,250);
})();
// Approval panel intentionally shows every application that is not yet finally rejected/approved/disbursed.
