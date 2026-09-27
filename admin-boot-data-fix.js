/* HELP FOR YOU — Admin data boot fix */
(()=>{'use strict';
async function boot(){
 try{
  if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}
  if(typeof window.loadData==='function')await window.loadData();
  if(typeof window.renderCore==='function')window.renderCore();
  ['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].forEach(id=>{if(typeof window.renderPanel==='function')window.renderPanel(id)});
  if(typeof window.renderWithdrawals==='function')window.renderWithdrawals();
 }catch(e){console.error('HFY Admin data boot:',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();