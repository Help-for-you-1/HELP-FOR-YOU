(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toFixed(2);
const dateOnly=v=>v?String(v).slice(0,10):'';
const db=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
async function getApproved(){
 const sb=db();
 const [a,c,l]=await Promise.all([
  sb.from('loan_applications').select('*'),
  sb.from('customers').select('*'),
  sb.from('loan_accounts').select('*')
 ]);
 if(a.error)throw a.error;if(c.error)throw c.error;if(l.error)throw l.error;
 return {apps:a.data||[],customers:c.data||[],loans:l.data||[]};
}
function addButton(){
 const root=document.getElementById('hfyReportsRoot');if(!root||document.getElementById('hfyNocBtn'))return;
 const actions=root.querySelector('.actions');if(!actions)return;
 const b=document.createElement('button');b.id='hfyNocBtn';b.className='btn blue';b.textContent='📄 No Objection Certificate';b.onclick=window.hfyOpenNOC;actions.appendChild(b);
}
window.hfyOpenNOC=async function(){
 try{
  const d=await getApproved();
  const approved=d.apps.filter(x=>String(x.status||'').toLowerCase()==='approved');
  const list=approved.map(a=>{const c=d.customers.find(x=>String(x.id)===String(a.customer_id))||{};const l=d.loans.find(x=>String(x.customer_id)===String(a.customer_id)&&String(x.loan_id||'')===String(a.loan_id||''))||{};return {a,c,l}});
  if(!list.length)return alert('No approved customer found.');
  const options=list.map((x,i)=>`<option value="${i}">${esc(x.c.full_name||x.a.full_name||x.a.name||'Customer')} — ${esc(x.l.loan_id||x.a.loan_id||'')}</option>`).join('');
  const html=`<h2>No Objection Certificate</h2><p>Select an approved customer and edit the certificate details before printing.</p><label>Approved Customer<select id="hfyNocSelect" onchange="hfyFillNOC()">${options}</select></label><div id="hfyNocForm"></div><div style="margin-top:14px"><button class="btn green" onclick="hfyPrintNOC()">🖨️ Print NOC</button></div>`;
  const modal=document.getElementById('modal');if(!modal)return;document.getElementById('mt').textContent='No Objection Certificate';document.getElementById('mb').innerHTML=html;modal.classList.add('on');window.hfyNocList=list;window.hfyFillNOC();
 }catch(e){console.error(e);alert('NOC load error: '+(e?.message||e));}
};
window.hfyFillNOC=function(){const x=window.hfyNocList?.[Number(document.getElementById('hfyNocSelect')?.value||0)];const f=document.getElementById('hfyNocForm');if(!x||!f)return;const c=x.c||{},a=x.a||{},l=x.l||{};const v=(...z)=>z.find(q=>q!==undefined&&q!==null&&String(q)!=='')||'';f.innerHTML=`<div class="form"><label>Certificate Date<input id="nocDate" type="date" value="${dateOnly(new Date().toISOString())}"></label><label>Loan ID<input id="nocLoan" value="${esc(v(l.loan_id,a.loan_id))}"></label><label>Full Name<input id="nocName" value="${esc(v(c.full_name,a.full_name,a.name))}"></label><label>Father / Mother Name<input id="nocParent" value="${esc(v(c.father_name,c.mother_name,a.father_name,a.mother_name))}"></label><label>Mobile Number<input id="nocMobile" value="${esc(v(c.mobile,a.mobile))}"></label><label>Address<input id="nocAddress" value="${esc(v(c.full_address,[c.house_no,c.street,c.village,c.post_office,c.district,c.state,c.pin_code].filter(Boolean).join(', '),a.full_address))}"></label><label>Loan Amount<input id="nocAmount" value="${esc(v(l.loan_amount,a.approved_amount,a.requested_amount))}"></label><label>Loan Status<input id="nocStatus" value="${esc(v(l.loan_status,'Completed'))}"></label><label class="full">NOC Remarks<textarea id="nocRemarks" style="width:100%;min-height:80px;margin-top:5px;border:1px solid #ccd5e0;border-radius:7px;padding:10px">This is to certify that there is no objection from HELP FOR YOU regarding the above-mentioned loan account, subject to the records and terms applicable to the account.</textarea></label></div>`};
window.hfyPrintNOC=function(){const g=id=>document.getElementById(id)?.value||'';const w=window.open('','_blank');if(!w)return alert('Please allow pop-ups to print the NOC.');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>HELP FOR YOU | No Objection Certificate</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:0;padding:30px}.cert{border:2px solid #123f7a;padding:34px;max-width:780px;margin:auto}h1{text-align:center;color:#123f7a;margin:0 0 5px}h2{text-align:center;margin:0 0 30px;font-size:18px}.meta{display:flex;justify-content:space-between;border-bottom:1px solid #ccd5e0;padding-bottom:12px;margin-bottom:22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.item{border-bottom:1px solid #ddd;padding:7px 0}.label{font-size:11px;color:#64748b}.value{font-weight:700;margin-top:3px}.text{line-height:1.7;margin:25px 0}.sign{display:flex;justify-content:space-between;margin-top:70px}.small{font-size:11px;color:#64748b}@page{size:A4;margin:14mm}@media print{body{padding:0}}</style></head><body><div class="cert"><h1>HELP FOR YOU</h1><h2>NO OBJECTION CERTIFICATE</h2><div class="meta"><span>Certificate Date: <b>${esc(g('nocDate'))}</b></span><span>Loan ID: <b>${esc(g('nocLoan'))}</b></span></div><p>To Whom It May Concern,</p><p class="text">This is to certify that <b>${esc(g('nocName'))}</b>, child of <b>${esc(g('nocParent'))}</b>, Mobile No. <b>${esc(g('nocMobile'))}</b>, residing at <b>${esc(g('nocAddress'))}</b>, is associated with the following loan account maintained in HELP FOR YOU records.</p><div class="grid"><div class="item"><div class="label">Loan ID</div><div class="value">${esc(g('nocLoan'))}</div></div><div class="item"><div class="label">Loan Amount</div><div class="value">${esc(g('nocAmount'))}</div></div><div class="item"><div class="label">Account Status</div><div class="value">${esc(g('nocStatus'))}</div></div><div class="item"><div class="label">Customer Mobile</div><div class="value">${esc(g('nocMobile'))}</div></div></div><p class="text">${esc(g('nocRemarks'))}</p><p class="text">This certificate is issued on the basis of the information available in our records and is intended for official record/reference purposes.</p><div class="sign"><div>Customer Signature<br><br>____________________</div><div style="text-align:right">Authorised Signatory<br><br>____________________<br><b>HELP FOR YOU</b></div></div><p class="small">This document is generated from HELP FOR YOU loan management records.</p></div></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300)};
let n=0;const timer=setInterval(()=>{addButton();if(++n>120)clearInterval(timer)},250);document.addEventListener('click',e=>{if(e.target.closest?.('[onclick*="show(\'reports\'"]'))setTimeout(addButton,100)});
})();
