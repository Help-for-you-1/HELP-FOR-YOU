/* HELP FOR YOU — Dashboard counter/data consistency fix */
(()=>{'use strict';
const sb=()=>window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
const money=v=>'₹'+Number(v||0).toFixed(2);
async function syncDashboard(){
 try{
  if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}
  const s=sb();
  const [a,c,l]=await Promise.all([
   s.from('loan_applications').select('id,status'),
   s.from('customers').select('id'),
   s.from('loan_accounts').select('id,remaining_amount,penalty_amount')
  ]);
  if(a.error||c.error||l.error){console.error('Dashboard sync:',a.error||c.error||l.error);return;}
  const apps=a.data||[], loans=l.data||[];
  const pending=new Set(['draft','submitted','pending','under_review']);
  const due=loans.reduce((n,x)=>n+Math.max(0,Number(x.remaining_amount||0))+Math.max(0,Number(x.penalty_amount||0)),0);
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('nA',apps.length);set('nP',apps.filter(x=>pending.has(String(x.status||'').toLowerCase())).length);
  set('nC',(c.data||[]).length);set('nL',loans.length);set('nD',money(due));
  document.querySelectorAll('#dash table tr').forEach((tr,i)=>{
   if(i>0){const cell=tr.cells&&tr.cells[3];if(cell)cell.textContent='5% per overdue day';}
  });
 }catch(e){console.error('HFY dashboard consistency fix:',e)}
}
window.syncDashboard=syncDashboard;
setTimeout(syncDashboard,1400);
setTimeout(syncDashboard,3000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncDashboard()});
})();