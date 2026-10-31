(function(){
'use strict';
const client=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN');
window.hfyLoadCivilRequests=async function(){
 const body=document.getElementById('hfyCivilAdminRows');if(!body)return;
 body.innerHTML='<tr><td colspan="9">Loading...</td></tr>';
 try{
  const sb=client(),r=await sb.from('hfy_civil_score_requests').select('id,mobile,pan,email,fee_amount,payment_slip_path,payment_status,created_at,slip_submitted_at,review_days,approved_at').order('created_at',{ascending:false});
  if(r.error)throw r.error;
  const rows=r.data||[];
  if(!rows.length){body.innerHTML='<tr><td colspan="9">No Civil Score Update requests yet.</td></tr>';return}
  body.innerHTML=rows.map(x=>'<tr><td>'+esc(String(x.id).slice(0,8))+'</td><td>'+esc(x.mobile)+'</td><td>'+esc(x.pan)+'</td><td>'+esc(x.email)+'</td><td>'+money(x.fee_amount)+'</td><td id="cslip-'+esc(x.id)+'">'+(x.payment_slip_path?'Loading slip...':'Not uploaded')+'</td><td><b>'+esc(x.payment_status==='active'?'Active':x.payment_status==='slip_submitted'?'Waiting / Review':x.payment_status)+'</b>'+(x.slip_submitted_at?'<br><small>'+esc(new Date(x.slip_submitted_at).toLocaleString())+'</small>':'')+'</td><td><input id="cdays-'+esc(x.id)+'" type="number" min="1" max="90" value="'+Number(x.review_days||10)+'" style="width:70px"></td><td><button class="btn blue" onclick="hfySaveCivilDays(\''+esc(x.id)+'\')">Save Days</button>'+(x.payment_status!=='active'?'<button class="btn green" onclick="hfyApproveCivil(\''+esc(x.id)+'\')">Approve / Active</button>':'<span class="paid">Approved</span>')+'</td></tr>').join('');
  for(const x of rows){if(x.payment_slip_path){const s=await sb.storage.from('loan-documents').createSignedUrl(x.payment_slip_path,3600);const el=document.getElementById('cslip-'+x.id);if(el)el.innerHTML=s.error?'Unavailable':'<a target="_blank" rel="noopener" href="'+esc(s.data.signedUrl)+'">View Slip</a>'}}
 }catch(e){body.innerHTML='<tr><td colspan="9">Could not load requests: '+esc(e.message||e)+'</td></tr>'}
};
window.hfySaveCivilDays=async function(id){
 const input=document.getElementById('cdays-'+id),days=Number(input?.value);
 if(!Number.isInteger(days)||days<1||days>90)return alert('Enter a period from 1 to 90 days.');
 const r=await client().from('hfy_civil_score_requests').update({review_days:days}).eq('id',id);
 if(r.error)return alert('Could not update period: '+r.error.message);
 alert('Review period updated to '+days+' days.');window.hfyLoadCivilRequests();
};
window.hfyApproveCivil=async function(id){
 if(!confirm('Approve this Civil Score Update request and set its status to Active?'))return;
 const r=await client().from('hfy_civil_score_requests').update({payment_status:'active',approved_at:new Date().toISOString()}).eq('id',id);
 if(r.error)return alert('Approval failed: '+r.error.message);
 alert('Request approved. Status is now Active.');window.hfyLoadCivilRequests();
};
})();
