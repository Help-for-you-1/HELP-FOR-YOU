(()=>{
'use strict';
const dbTL=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const moneyTL=v=>'₹'+Number(v||0).toFixed(2);
const escTL=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const todayTL=()=>new Date().toISOString().slice(0,10);
const penaltyTL=e=>{const due=String(e.due_date||'').slice(0,10),t=todayTL();if(!due||due>=t||String(e.status||'').toLowerCase()==='paid')return Number(e.penalty||0);const days=Math.max(0,Math.floor((new Date(t+'T00:00:00')-new Date(due+'T00:00:00'))/86400000));const amount=Number(e.emi_amount||0);return Number((amount*(Math.pow(1.05,days)-1)).toFixed(2));};
let busyTL=false;
async function fixTotalLoanOnly(){
 if(busyTL)return;const body=document.getElementById('reRows');if(!body)return;
 try{busyTL=true;const sb=dbTL();const [lr,cr,er,ar]=await Promise.all([sb.from('loan_accounts').select('*').order('created_at',{ascending:false}),sb.from('customers').select('*'),sb.from('loan_emi_schedule').select('*').order('emi_number',{ascending:true}),sb.from('loan_applications').select('*')]);
 if(lr.error)throw lr.error;if(cr.error)throw cr.error;if(er.error)throw er.error;if(ar.error)throw ar.error;
 const loans=lr.data||[],cs=cr.data||[],es=er.data||[],apps=ar.data||[];window.__emiLoanRows=loans;
 let dashboardDue=0;
 const html=loans.map((l,i)=>{const c=cs.find(x=>String(x.id)===String(l.customer_id));const app=apps.find(x=>String(x.id)===String(l.application_id))||apps.find(x=>String(x.customer_id)===String(l.customer_id)&&String(x.status||'').toLowerCase()==='approved');const rows=es.filter(e=>String(e.loan_account_id)===String(l.id)||String(e.loan_id)===String(l.loan_id));const scheduleTotal=rows.reduce((n,e)=>n+Number(e.emi_amount||0),0);const loanTotal=Number(l.total_repayment||0),appTotal=Number(app?.total_repayment||0);const total=loanTotal>0?loanTotal:appTotal>0?appTotal:scheduleTotal>0?scheduleTotal:Number(l.loan_amount||app?.approved_amount||app?.requested_amount||0);const paid=Number(l.total_paid||rows.reduce((n,e)=>n+Number(e.paid_amount||0),0));const penalty=rows.reduce((n,e)=>n+penaltyTL(e),0);const remaining=Math.max(0,total-paid)+penalty;dashboardDue+=remaining;const overdue=rows.filter(e=>String(e.status||'').toLowerCase()!=='paid'&&Number(e.paid_amount||0)<Number(e.emi_amount||0)+penaltyTL(e)&&String(e.due_date||'')<todayTL()).reduce((n,e)=>n+Math.max(0,Number(e.emi_amount||0)+penaltyTL(e)-Number(e.paid_amount||0)),0);const status=rows.length&&rows.every(e=>String(e.status||'').toLowerCase()==='paid'||Number(e.paid_amount||0)>=Number(e.emi_amount||0)+penaltyTL(e))?'paid':overdue>0?'overdue':'pending';return `<tr><td>${escTL(c?.full_name||app?.full_name||'-')}</td><td>${escTL(l.loan_id||'-')}</td><td>${escTL(c?.mobile||app?.mobile||'-')}</td><td>${moneyTL(l.loan_amount||app?.approved_amount||app?.requested_amount)}</td><td>${moneyTL(total)}</td><td>${escTL(l.start_date||app?.disbursement_date||'-')}</td><td>${moneyTL(overdue)}</td><td>${escTL(status)}</td><td><button class="btn blue" onclick="viewLoanEmi(${i})">View</button></td></tr>`}).join('');
 const next=html||'<tr><td colspan="9">No EMI / Repayment records.</td></tr>';if(body.innerHTML!==next)body.innerHTML=next;
 const nd=document.getElementById('nD');if(nd)nd.textContent=moneyTL(dashboardDue);const rd=document.getElementById('reportDue');if(rd)rd.textContent=moneyTL(dashboardDue);
 }catch(e){console.error('Total Loan/Due display fix:',e)}finally{busyTL=false}
}
window.fixTotalLoanOnly=fixTotalLoanOnly;
setTimeout(fixTotalLoanOnly,900);
const r=document.getElementById('reRows');if(r)new MutationObserver(()=>setTimeout(fixTotalLoanOnly,0)).observe(r,{childList:true});
})();
