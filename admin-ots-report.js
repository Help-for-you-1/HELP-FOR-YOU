(()=> {
'use strict';
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const tempLoanId=a=>'HFY-TEMP-APP-'+String(a?.id??'').replace(/[^a-zA-Z0-9-]/g,'');
const loanId=(l,a)=>l?.loan_id||l?.id||tempLoanId(a);
const cleanPan=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
async function otsApplicationId(a,c){const pan=cleanPan(a?.pan_number||c?.pan_number);if(pan){const r=await db().from('hfy_civil_score_requests').select('temporary_id').eq('pan',pan).order('created_at',{ascending:false}).limit(1).maybeSingle();if(r.error)throw r.error;if(r.data?.temporary_id)return r.data.temporary_id;}return tempLoanId(a);}
let customers=[],loans=[],apps=[];
async function load(){
 const sb=db();
 const rs=await Promise.all([sb.from('customers').select('*').order('full_name'),sb.from('loan_accounts').select('*'),sb.from('loan_applications').select('*')]);
 for(const r of rs)if(r.error)throw r.error;
 customers=rs[0].data||[];loans=rs[1].data||[];apps=rs[2].data||[];
}
function install(){
 const root=document.getElementById('hfyReportsRoot');
 if(!root)return false;
 const actions=root.querySelector('.actions');
 if(!actions)return false;
 if(!document.getElementById('hfyOTSButton')){
  const b=document.createElement('button');b.id='hfyOTSButton';b.className='btn blue';b.type='button';b.textContent='📄 OTS Proposal / Print';b.addEventListener('click',window.hfyOpenOTS);actions.appendChild(b);
 }
 if(!document.getElementById('hfyOTSManageButton')){
  const b=document.createElement('button');b.id='hfyOTSManageButton';b.className='btn gray';b.type='button';b.textContent='📋 Saved OTS Records';b.addEventListener('click',window.hfyManageOTS);actions.appendChild(b);
 }
 return true;
}
window.hfyManageOTS=async function(){
 try{
  const sb=db(),r=await sb.rpc('hfy_admin_list_ots_requests');if(r.error)throw r.error;
  const rows=Array.isArray(r.data)?r.data:[];
  const body=await Promise.all(rows.map(async x=>{
   let slip='—';
   if(x.payment_slip_path){const u=await sb.storage.from('ots-payment-slips').createSignedUrl(x.payment_slip_path,3600);if(!u.error&&u.data?.signedUrl)slip='<a target="_blank" rel="noopener" href="'+esc(u.data.signedUrl)+'">View slip</a>'}
   return '<tr><td>'+esc(x.temporary_id)+'<br>App: '+esc(x.application_id)+'<br>'+esc(x.customer_name||'')+'</td><td><input id="hfyOTSAdminAmount_'+esc(x.temporary_id)+'" type="number" min="1" step="0.01" value="'+esc(x.settlement_amount)+'" style="width:120px"></td><td><select id="hfyOTSAdminStatus_'+esc(x.temporary_id)+'"><option value="pay" '+(x.status==='pay'?'selected':'')+'>Pay</option><option value="wait_for_reapply" '+(x.status==='wait_for_reapply'?'selected':'')+'>Wait for Reapply</option><option value="approved" '+(x.status==='approved'?'selected':'')+'>Approved</option><option value="rejected" '+(x.status==='rejected'?'selected':'')+'>Rejected</option></select></td><td>'+slip+'</td><td><button class="btn green" type="button" onclick="hfySaveOTSAdminRow(\''+esc(x.temporary_id)+'\')">Save</button></td></tr>';
  }));
  const html='<p>Saved OTS proposals. Change the settlement amount or status and press Save.</p><div class="wrap"><table><thead><tr><th>Temporary ID / Customer</th><th>Settlement Amount (₹)</th><th>Status</th><th>Payment Slip</th><th>Action</th></tr></thead><tbody>'+(body.join('')||'<tr><td colspan="5">No saved OTS records.</td></tr>')+'</tbody></table></div>';
  window.openBox('Saved OTS Records',html);
 }catch(e){console.error(e);alert('Could not load saved OTS records: '+(e?.message||e))}
};
window.hfySaveOTSAdminRow=async function(id){
 try{
  const amount=Number(document.getElementById('hfyOTSAdminAmount_'+id)?.value||0);
  const status=document.getElementById('hfyOTSAdminStatus_'+id)?.value||'pay';
  const r=await db().rpc('hfy_admin_update_ots_request',{p_temporary_id:id,p_settlement_amount:amount,p_status:status});
  if(r.error)throw r.error;if(!r.data?.success)throw new Error('Update failed');
  alert('OTS record updated successfully.');window.hfyManageOTS();
 }catch(e){alert('OTS update failed: '+(e?.message||e))}
};
window.hfyOpenOTS=async function(){
 try{
  await load();
  if(!apps.length)return alert('No applications found.');
  const options=apps.map((a,i)=>{
   const c=customers.find(x=>String(x.id)===String(a.customer_id))||{};
   const name=a.full_name||a.name||c.full_name||c.name||'Customer';
   const mobile=a.mobile||c.mobile||'-';
   const status=a.status||'Unknown';
   return '<option value="'+i+'">Application ID: '+esc(a.id)+' — '+esc(name)+' — '+esc(mobile)+' — '+esc(status)+'</option>';
  }).join('');
  const html='<p>Select any application. All statuses are included, whether approved or not.</p><label>Application<select id="hfyOTSSelect" onchange="hfyOTSPreview()">'+options+'</select></label><div style="margin-top:12px"><label>Proposed Settlement Amount (₹)<input id="hfyOTSAmount" type="number" min="1" step="0.01" value="6000" style="width:100%;margin-top:5px"></label></div><label style="display:block;margin-top:10px"><input id="hfyOTSShowLoanAmount" type="checkbox" onchange="hfyOTSPreview()"> Show loan amount (hidden by default)</label><div id="hfyOTSPreview" style="margin-top:12px"></div><div class="actions"><button class="btn green" type="button" onclick="hfyPrintOTS()">🖨️ Print / Save PDF</button></div>'
  window.openBox('One Time Settlement (OTS) Proposal',html);
  window.hfyOTSPreview();
 }catch(e){console.error(e);alert('OTS application list load error: '+(e?.message||e))}
};
window.hfyOTSPreview=function(){
 const a=apps[Number(document.getElementById('hfyOTSSelect')?.value||0)];
 const el=document.getElementById('hfyOTSPreview');if(!a||!el)return;
 const c=customers.find(x=>String(x.id)===String(a.customer_id))||{};
 const name=a.full_name||a.name||c.full_name||c.name||'Customer';
 const mobile=a.mobile||c.mobile||'-';
 const status=a.status||'Unknown';
 const cl=loans.filter(x=>String(x.application_id)===String(a.id)||(a.customer_id!=null&&String(x.customer_id)===String(a.customer_id)));
 const showAmount=!!document.getElementById('hfyOTSShowLoanAmount')?.checked;
 const ids=cl.length?cl.map(l=>loanId(l,a)).join(', '):tempLoanId(a)+' (temporary)';
 const amounts=cl.length?cl.map(l=>showAmount?money(l.loan_amount||0):'HIDDEN').join(', '):'HIDDEN';
 const sharedId=await otsApplicationId(a,c);
 el.innerHTML='<div class="card"><b>'+esc(name)+'</b><br>Application ID: '+esc(a.id)+'<br>Civil Report / OTS Application ID: '+esc(sharedId)+'<br>Application Status: '+esc(status)+'<br>Customer ID: '+esc(a.customer_id||'Not linked')+'<br>Mobile: '+esc(mobile)+'<br>Loan ID: '+esc(ids)+'<br>Loan Amount: '+esc(amounts)+'</div>';
};
window.hfyPrintOTS=async function(){
 const a=apps[Number(document.getElementById('hfyOTSSelect')?.value||0)];
 const amount=Number(document.getElementById('hfyOTSAmount')?.value||0);
 if(!a)return alert('Please select an application.');
 if(!Number.isFinite(amount)||amount<=0)return alert('Enter a valid settlement amount.');
 const c=customers.find(x=>String(x.id)===String(a.customer_id))||{};
 const covered=loans.filter(x=>String(x.application_id)===String(a.id)||(a.customer_id!=null&&String(x.customer_id)===String(a.customer_id)));
 const showLoanAmount=!!document.getElementById('hfyOTSShowLoanAmount')?.checked;
 const name=a.full_name||a.name||c.full_name||c.name||'Customer';
 const parent=c.father_name||c.parent_name||c.guardian_name||a.father_name||a.parent_name||a.guardian_name||'';
 const address=c.full_address||c.address||a.full_address||a.address||[a.house||c.house,a.street||c.street,a.village||c.village,a.post_office||c.post_office,a.district||c.district,a.state||c.state,a.pincode||c.pincode].filter(Boolean).join(', ');
 const mobile=a.mobile||c.mobile||'-';
 const status=a.status||'Unknown';
 const today=new Date();
 const date=today.toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
 const otsId=await otsApplicationId(a,c);
 const year=today.getFullYear();
 const ref='HFY/OTS/'+String(a.id).replace(/[^a-zA-Z0-9-]/g,'')+'/'+year;
 const loanRows=covered.length?covered.map(l=>'<tr><td>'+esc(loanId(l,a))+'</td><td>'+(showLoanAmount?money(l.loan_amount||0):'HIDDEN')+'</td><td>'+esc(l.loan_status||l.status||'As per records')+'</td></tr>').join(''):'<tr><td>'+esc(tempLoanId(a))+' (Temporary)</td><td>HIDDEN</td><td>No linked loan account found; temporary reference only</td></tr>';
 const save=await db().rpc('hfy_admin_save_ots_request',{
  p_temporary_id:otsId,p_application_id:Number(a.id),p_customer_name:name,p_mobile:mobile,
  p_loan_id:covered.length?covered.map(l=>loanId(l,a)).join(', '):otsId,
  p_proposal_ref:ref,p_settlement_amount:amount
 });
 if(save.error)throw save.error;
 if(!save.data?.success)throw new Error('OTS record could not be saved.');
 try{await window.HFY_LOGO_READY}catch(e){}
 const logo=window.HFY_LOGO_URL||new URL('hfy-logo.svg',location.href).href;
 const w=window.open('','_blank');if(!w)return alert('Please allow pop-ups to print the OTS proposal.');
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>HELP FOR YOU | OTS Proposal</title><style>@page{size:A4;margin:17mm}body{font:12px Arial,sans-serif;color:#172033;line-height:1.55;margin:0}.head{text-align:center;border-bottom:2px solid #17365d;padding-bottom:12px;margin-bottom:18px}.head img{width:74px;height:74px;object-fit:contain;vertical-align:middle}.brand{font-size:23px;font-weight:800;color:#17365d;margin:4px}.sub{font-size:13px;font-weight:bold}.meta{background:#f2f5f9;padding:10px;border:1px solid #d5dde8;display:flex;justify-content:space-between}.amount{margin:14px 0;padding:13px;border:1px solid #aab9cc;background:#f2f5f9;font-weight:bold;font-size:15px}h3{font-size:14px;color:#17365d;margin:18px 0 6px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ccd5e0;padding:7px;text-align:left}th{background:#f2f5f9}.notice{padding:10px;border-left:3px solid #d28a00;background:#fff8e8;margin-top:12px}.foot{text-align:center;border-top:1px solid #d5dde8;margin-top:30px;padding-top:10px;font-weight:bold;color:#17365d}.small{text-align:center;font-size:10px;color:#555}@media print{button{display:none}}</style></head><body><div class="head"><img src="'+logo+'" alt="HELP FOR YOU logo"><div class="brand">HELP FOR YOU</div><div class="sub">ONE TIME SETTLEMENT (OTS) – PROPOSAL LETTER</div></div><div class="meta"><span><b>Reference No.:</b> '+esc(ref)+'</span><span><b>Date:</b> '+esc(date)+'</span></div><h3>Application Details</h3><p><b>Application ID:</b> '+esc(a.id)+'<br><b>Application Status:</b> '+esc(status)+'<br><b>Civil Score / OTS Status Check ID:</b> '+esc(otsId)+'</p><h3>Customer Details</h3><p><b>Name:</b> '+esc(name)+'<br><b>Father / Guardian Name:</b> '+esc(parent||'Not available')+'<br><b>Customer ID:</b> '+esc(a.customer_id||c.id||'Not linked')+'<br><b>Mobile:</b> '+esc(mobile)+'<br><b>Address:</b> '+esc(address||'Not available')+'</p><h3>Loan Accounts on Record</h3><table><thead><tr><th>Loan ID</th><th>Loan Amount</th><th>Recorded Status</th></tr></thead><tbody>'+loanRows+'</tbody></table><div class="amount">Proposed One-Time Settlement Amount: '+money(amount)+'<br><span style="font-size:12px">('+esc(amount.toLocaleString('en-IN'))+' Rupees Only)</span></div><p>This proposal is for settlement of eligible previous loan dues recorded with HELP FOR YOU, limited to the loan account(s) specifically identified and approved in the final settlement record.</p><h3>Terms &amp; Conditions</h3><ol><li>This is a proposal only. It becomes effective only after formal approval by HELP FOR YOU and successful receipt of the approved settlement amount.</li><li>Only loan account(s) expressly listed in the approved settlement confirmation will be treated as settled.</li><li>After successful settlement, no further amount will be claimed against the covered account(s), subject to the approved settlement terms.</li><li>HELP FOR YOU will process applicable credit bureau/CIBIL status updates after settlement, accurately reflecting the account status and applicable reporting requirements.</li><li>Credit bureau updates are subject to bureau processing timelines. Improvement in the CIBIL score is not guaranteed.</li></ol><div class="notice"><b>Important Notice:</b> This system-generated document is a settlement proposal only. It is not proof of payment, loan closure, or approval of settlement. Final settlement confirmation can be issued only after authorized approval, verification of payment, and confirmation of the specific loan account(s) covered.</div><div class="foot">System Generated Document – HELP FOR YOU</div><div class="small">No handwritten signature or company seal is required for this proposal.</div><script>window.onload=function(){setTimeout(function(){window.print()},350)};<\/script></body></html>');
 w.document.close();
};
let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},250);
document.addEventListener('click',e=>{if(e.target.closest?.('[onclick*="reports"]'))setTimeout(install,100)});
})();
