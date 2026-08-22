(()=>{
'use strict';
const dbSD=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const nextSD=(date,n)=>{const d=new Date(String(date).slice(0,10)+'T00:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
async function syncEmiDatesSD(){
  try{
    const sb=dbSD();
    const loans=await sb.from('loan_accounts').select('id,start_date');
    if(loans.error)throw loans.error;
    for(const loan of loans.data||[]){
      if(!loan.start_date)continue;
      const rows=await sb.from('loan_emi_schedule').select('id,emi_number,due_date').eq('loan_account_id',loan.id).order('emi_number',{ascending:true});
      if(rows.error)throw rows.error;
      for(const e of rows.data||[]){
        const correct=nextSD(loan.start_date,Number(e.emi_number||1));
        if(String(e.due_date||'').slice(0,10)!==correct){
          const u=await sb.from('loan_emi_schedule').update({due_date:correct}).eq('id',e.id);
          if(u.error)throw u.error;
        }
      }
    }
  }catch(e){console.error('EMI sanction date sync:',e)}
}
let lastShowSD=null;
function installShowSD(){
  const current=window.show;
  if(!current||current===lastShowSD||current.__emiSanctionDateWrapper)return;
  const wrapped=function(id,b){const r=current.apply(this,arguments);if(id==='repay')setTimeout(syncEmiDatesSD,300);return r};
  wrapped.__emiSanctionDateWrapper=true;
  window.show=wrapped;
  lastShowSD=wrapped;
}
setInterval(installShowSD,500);
setTimeout(syncEmiDatesSD,1200);
setTimeout(syncEmiDatesSD,2500);
})();
