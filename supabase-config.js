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
        window.apRows.innerHTML = pending.map(({x,index})=>`<tr><td>${esc(x.name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.date)}</td><td>₹${money(x.amount)}</td><td class="pending">${esc(x.kyc_status||x.kyc||'Pending')} / Pending for Approval</td><td><button class="btn blue" onclick="editApproval(${index})">Edit</button></td></tr>`).join('') || '<tr><td colspan="6">No pending approval.</td></tr>';
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
    window.openAddCustomer=function(){if(typeof openBox!=='function')return;openBox('Add Customer',`<div class="form"><label>Full Name<input id="acName" autocomplete="name" required></label><label>Mobile Number<input id="acMobile" inputmode="tel" maxlength="15" required></label><label>Email<input id="acEmail" type="email"></label><label>Date of Birth<input id="acDob" type="date"></label><label>Gender<select id="acGender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Occupation<input id="acOccupation"></label><label>Monthly Income<input id="acIncome" type="number" min="0"></label><label>PAN Number<input id="acPan" maxlength="10" style="text-transform:uppercase"></label><label>Aadhaar Number<input id="acAadhaar" inputmode="numeric" maxlength="12"></label><label>State<input id="acState"></label><label>District<input id="acDistrict"></label><label>Pincode<input id="acPincode" inputmode="numeric" maxlength="6"></label><label class="full">Address<input id="acAddress"></label><div class="full"><button class="btn green" onclick="saveNewCustomer()">Save Customer</button><button class="btn gray" onclick="closeM()">Cancel</button></div></div>`);};
    window.saveNewCustomer=async function(){const name=document.getElementById('acName').value.trim(),mobile=document.getElementById('acMobile').value.trim();if(!name||!mobile){alert('Name and Mobile Number are required.');return}const code='CUST-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,8).toUpperCase();const row={customer_code:code,full_name:name,mobile,email:document.getElementById('acEmail').value.trim()||null,date_of_birth:document.getElementById('acDob').value||null,gender:document.getElementById('acGender').value||null,occupation:document.getElementById('acOccupation').value.trim()||null,monthly_income:document.getElementById('acIncome').value?Number(document.getElementById('acIncome').value):null,pan_number:document.getElementById('acPan').value.trim().toUpperCase()||null,aadhaar_number:document.getElementById('acAadhaar').value.trim()||null,state:document.getElementById('acState').value.trim()||null,district:document.getElementById('acDistrict').value.trim()||null,pincode:document.getElementById('acPincode').value.trim()||null,address:document.getElementById('acAddress').value.trim()||null,kyc_status:'Pending',status:'active',account_status:'active'};const{data,error}=await client.from('customers').insert(row).select('*').single();if(error){alert('Customer save failed: '+error.message);return}const app={customer_id:data.id,full_name:name,name,mobile,email:row.email,address:row.address,date_of_birth:row.date_of_birth,gender:row.gender,occupation:row.occupation,monthly_income:row.monthly_income,pan_number:row.pan_number,aadhaar_number:row.aadhaar_number,status:'submitted',kyc_status:'Pending',requested_amount:0,updated_at:new Date().toISOString()};const{error:appError}=await client.from('loan_applications').insert(app);if(appError){alert('Customer saved, but application creation failed: '+appError.message);return}if(typeof loadData==='function')await loadData();closeM();alert('Customer added successfully and sent to All Applications + Approval. Customer ID: '+data.id)};
  } if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootAddCustomer);else setTimeout(bootAddCustomer,250);
})();
(function(){
  function kycBoot(){
    if(!location.pathname.toLowerCase().endsWith('/admin.html'))return;
    const approval=document.getElementById('approval');if(!approval){setTimeout(kycBoot,400);return}
    if(document.getElementById('hfyKycSection'))return;
    const sec=document.createElement('section');sec.id='hfyKycSection';sec.className='panel';sec.innerHTML='<h2>KYC Approved</h2><div class="wrap"><table><thead><tr><th>Name</th><th>Mobile</th><th>Application</th><th>Loan Amount</th><th>KYC Status</th><th>Documents</th><th>Action</th></tr></thead><tbody id="hfyKycRows"></tbody></table></div>';
    approval.parentNode.insertBefore(sec,approval.nextSibling);
    const nav=document.createElement('div');nav.className='m';nav.id='hfyKycNav';nav.textContent='🪪 KYC Approved';nav.onclick=function(){document.querySelectorAll('.panel').forEach(x=>x.classList.remove('on'));sec.classList.add('on');document.querySelectorAll('.m').forEach(x=>x.classList.remove('on'));nav.classList.add('on')};const approvalNav=[...document.querySelectorAll('.m')].find(x=>x.textContent.includes('Approval'));if(approvalNav)approvalNav.parentNode.insertBefore(nav,approvalNav.nextSibling);
    window.renderKyc=function(){const rows=document.getElementById('hfyKycRows');if(!rows)return;const apps=window.db?.applications||[];rows.innerHTML=apps.map((x,i)=>{const s=String(x.kyc_status||x.kyc||'Pending').toLowerCase();const docs=x.documents||'Not uploaded';return `<tr><td>${esc(x.name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.id)}</td><td>₹${money(x.amount)}</td><td class="${s==='approved'?'paid':s==='rejected'?'over':'pending'}">${esc(x.kyc_status||x.kyc||'Pending')}</td><td>${esc(docs)}</td><td>${s==='approved'?'<b class="paid">KYC Approved</b>':s==='rejected'?'<b class="over">KYC Rejected</b>':`<button class="btn green" onclick="approveKyc(${i})">Approve KYC</button><button class="btn red" onclick="rejectKyc(${i})">Reject KYC</button>`}</td></tr>`}).join('')||'<tr><td colspan="7">No KYC applications.</td></tr>'};
    window.approveKyc=async function(i){const x=window.db?.applications?.[i];if(!x)return;try{let r=await client.from('loan_applications').update({kyc_status:'Approved',updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;if(x.customer_id){r=await client.from('customers').update({kyc_status:'Approved',updated_at:new Date().toISOString()}).eq('id',x.customer_id);if(r.error)throw r.error}if(typeof loadData==='function')await loadData();renderKyc();alert('KYC Approved successfully.')}catch(e){alert('KYC approval failed: '+e.message)}};
    window.rejectKyc=async function(i){const x=window.db?.applications?.[i];if(!x)return;const reason=prompt('Enter KYC rejection reason:','Documents not verified');if(reason===null)return;try{let r=await client.from('loan_applications').update({kyc_status:'Rejected',kyc_rejection_reason:reason,updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;if(x.customer_id){r=await client.from('customers').update({kyc_status:'Rejected',updated_at:new Date().toISOString()}).eq('id',x.customer_id);if(r.error)throw r.error}if(typeof loadData==='function')await loadData();renderKyc();alert('KYC rejected.')}catch(e){alert('KYC rejection failed: '+e.message)}};
    const oldRender=window.render;window.render=function(){if(oldRender)oldRender();renderKyc()};
    setTimeout(renderKyc,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(kycBoot,800));else setTimeout(kycBoot,800);
})();
(function(){
  function approvalGuard(){
    if(!location.pathname.toLowerCase().endsWith('/admin.html'))return;
    if(typeof window.approve!=='function'){setTimeout(approvalGuard,400);return}
    const original=window.approve;
    window.approve=async function(i){const x=window.db?.applications?.[i];if(!x)return;const k=String(x.kyc_status||x.kyc||'Pending').toLowerCase();if(k!=='approved'){alert('KYC must be Approved before Loan Approval. Please approve KYC first.');return}return original(i)};
  }
  setTimeout(approvalGuard,1800);
})();
(function(){
  function editKyc(){
    if(!location.pathname.toLowerCase().endsWith('/admin.html'))return;
    if(typeof window.editApproval!=='function'){setTimeout(editKyc,400);return}
    const original=window.editApproval;
    window.editApproval=function(i){const x=window.db?.applications?.[i];if(!x)return;openBox('Edit / Approval',`<div class="form"><label>Name<input id="en" value="${esc(x.name)}"></label><label>Mobile<input id="em" value="${esc(x.mobile)}"></label><label>Apply Date<input id="edate" type="date" value="${esc(x.date)}"></label><label>Loan Amount<input id="ea" type="number" value="${Number(x.amount||0)}"></label><label>Email<input id="ee" value="${esc(x.email||'')}"></label><label>KYC Status<select id="ek"><option ${String(x.kyc_status||x.kyc).toLowerCase()==='pending'?'selected':''}>Pending</option><option ${String(x.kyc_status||x.kyc).toLowerCase()==='under review'?'selected':''}>Under Review</option><option ${String(x.kyc_status||x.kyc).toLowerCase()==='approved'?'selected':''}>Approved</option><option ${String(x.kyc_status||x.kyc).toLowerCase()==='rejected'?'selected':''}>Rejected</option></select></label><label>PAN<input id="epan" value="${esc(x.pan_number||'')}"></label><label>Aadhaar<input id="eaad" value="${esc(x.aadhaar_number||'')}"></label><label class="full">Address<input id="ead" value="${esc(x.address||'')}"></label><div class="full"><button class="btn blue" onclick="saveKycEdit(${i})">Save Changes</button><button class="btn green" onclick="approveKyc(${i})">Approve KYC</button><button class="btn red" onclick="rejectKyc(${i})">Reject KYC</button><button class="btn green" onclick="approve(${i})">Approve Loan</button><button class="btn red" onclick="reject(${i})">Reject Loan</button></div></div>`)};
    window.saveKycEdit=async function(i){const x=window.db?.applications?.[i];if(!x)return;try{const vals={full_name:document.getElementById('en').value.trim(),name:document.getElementById('en').value.trim(),mobile:document.getElementById('em').value.trim(),address:document.getElementById('ead').value.trim(),email:document.getElementById('ee').value.trim()||null,pan_number:document.getElementById('epan').value.trim().toUpperCase()||null,aadhaar_number:document.getElementById('eaad').value.trim()||null,kyc_status:document.getElementById('ek').value,updated_at:new Date().toISOString()};let r=await client.from('loan_applications').update(vals).eq('id',x.id);if(r.error)throw r.error;if(x.customer_id){r=await client.from('customers').update({full_name:vals.full_name,mobile:vals.mobile,address:vals.address,email:vals.email,pan_number:vals.pan_number,aadhaar_number:vals.aadhaar_number,kyc_status:vals.kyc_status,updated_at:new Date().toISOString()}).eq('id',x.customer_id);if(r.error)throw r.error}if(typeof loadData==='function')await loadData();closeM();alert('Application and KYC details saved.')}catch(e){alert('Save failed: '+e.message)}};
  }
  setTimeout(editKyc,2200);
})();
