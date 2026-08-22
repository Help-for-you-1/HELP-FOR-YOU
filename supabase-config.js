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
      const app={customer_id:data.id,full_name:name,name,mobile,email:row.email,address:row.address,date_of_birth:row.date_of_birth,gender:row.gender,occupation:row.occupation,monthly_income:row.monthly_income,pan_number:row.pan_number,aadhaar_number:row.aadhaar_number,status:'submitted',kyc_status:'Pending',requested_amount:0,updated_at:new Date().toISOString()};
      const {error:appError}=await client.from('loan_applications').insert(app);
      if(appError){console.error('Application creation failed',appError);alert('Customer saved, but application creation failed: '+appError.message);if(typeof loadData==='function')await loadData();closeM();return;}
      if(typeof loadData==='function')await loadData();
      closeM();
      alert('Customer added successfully and sent to All Applications + Approval. Customer ID: '+data.id+'\nCustomer Code: '+data.customer_code);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootAddCustomer);else setTimeout(bootAddCustomer,250);
})();

// Robust approval override: keeps the existing Admin design, but fixes field mapping,
// customer linking, numeric Loan ID generation, loan account creation and EMI schedule.
(function () {
  function installApprovalFix() {
    if (!location.pathname.toLowerCase().endsWith('/admin.html')) return;
    if (typeof window.approve !== 'function') { setTimeout(installApprovalFix,300); return; }
    window.approve = async function(i) {
      const x = window.db?.applications?.[i];
      if (!x) { alert('Application not found. Please refresh Admin.'); return; }
      const value = id => document.getElementById(id)?.value ?? '';
      const name = value('en').trim() || x.name || x.full_name || '';
      const mobile = value('em').trim() || x.mobile || '';
      const amount = Number(value('ea') || x.approved_amount || x.requested_amount || x.loan_amount || 0);
      const kyc = value('ek') || x.kyc_status || 'Pending';
      const address = value('ead') || x.address || '';
      const applyDate = value('edate') || x.date || new Date().toISOString().slice(0,10);
      const email = value('ee').trim() || x.email || null;
      const pan = value('epan').trim().toUpperCase() || x.pan_number || null;
      const aadhaar = value('eaad').trim() || x.aadhaar_number || null;
      const months = Number(x.tenure_months || x.tenure || (amount <= 5000 ? 1 : amount <= 10000 ? 2 : amount <= 20000 ? 3 : 0));
      if (!amount || amount < 1000 || amount > 20000 || !months) { alert('Loan amount must be ₹1,000 to ₹20,000.'); return; }
      const interestRate = Number(x.interest_rate || 20);
      const totalRepayment = Number(x.total_repayment || (amount + amount * interestRate / 100 * months));
      const dailyEmi = totalRepayment / (months * 30);
      try {
        const applicationUpdate = {
          full_name:name,name,mobile,email,address,pan_number:pan,aadhaar_number:aadhaar,
          requested_amount:Number(x.requested_amount || amount),approved_amount:amount,loan_amount:amount,
          interest_rate:interestRate,tenure:months,tenure_months:months,emi_amount:totalRepayment / months,
          daily_emi:dailyEmi,total_interest:totalRepayment-amount,total_repayment:totalRepayment,
          kyc_status:kyc,status:'approved',updated_at:new Date().toISOString()
        };
        let r = await client.from('loan_applications').update(applicationUpdate).eq('id',x.id);
        if (r.error) throw r.error;

        let customerId = x.customer_id || null;
        if (customerId) {
          r = await client.from('customers').update({full_name:name,mobile,email,address,pan_number:pan,aadhaar_number:aadhaar,kyc_status:kyc,updated_at:new Date().toISOString()}).eq('id',customerId);
          if (r.error) throw r.error;
        } else {
          const existing = await client.from('customers').select('id').eq('mobile',mobile).maybeSingle();
          if (existing.error) throw existing.error;
          if (existing.data) customerId=existing.data.id;
          else {
            const created=await client.from('customers').insert({full_name:name,mobile,email,address,pan_number:pan,aadhaar_number:aadhaar,kyc_status:kyc,status:'active',account_status:'active'}).select('id').single();
            if (created.error) throw created.error;
            customerId=created.data.id;
          }
          r=await client.from('loan_applications').update({customer_id:customerId}).eq('id',x.id);
          if(r.error)throw r.error;
        }

        const maxR=await client.from('loan_accounts').select('loan_id').not('loan_id','is',null).order('loan_id',{ascending:false}).limit(1);
        if(maxR.error)throw maxR.error;
        const nextLoanId=(maxR.data?.length ? Number(maxR.data[0].loan_id) : 100000)+1;
        const start=applyDate || new Date().toISOString().slice(0,10);
        const endDate=new Date(start+'T00:00:00');
        endDate.setDate(endDate.getDate()+months*30);
        const account={loan_id:nextLoanId,customer_id:customerId,loan_amount:amount,total_repayment:totalRepayment,tenure_months:months,daily_emi:dailyEmi,total_paid:0,remaining_amount:totalRepayment,missed_days:0,penalty_amount:0,loan_status:'active',start_date:start,end_date:endDate.toISOString().slice(0,10),application_id:x.id};
        const acc=await client.from('loan_accounts').insert(account).select('id').single();
        if(acc.error)throw acc.error;
        const rows=[];
        for(let n=1;n<=months*30;n++){
          const d=new Date(start+'T00:00:00');d.setDate(d.getDate()+n);
          rows.push({loan_account_id:acc.data.id,loan_id:nextLoanId,customer_id:customerId,emi_number:n,due_date:d.toISOString().slice(0,10),emi_amount:dailyEmi,penalty:0,total_due:dailyEmi,paid_amount:0,remaining_amount:dailyEmi,status:'pending'});
        }
        const emi=await client.from('loan_emi_schedule').insert(rows);
        if(emi.error)throw emi.error;
        if(typeof loadData==='function')await loadData();
        if(typeof closeM==='function')closeM();
        alert('Approved successfully. Loan ID: '+nextLoanId);
      } catch(e) {
        console.error('Approval failed',e);
        alert('Approval failed: '+(e.message||e));
      }
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(installApprovalFix,1200));else setTimeout(installApprovalFix,1200);
})();
