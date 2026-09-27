/* HELP FOR YOU — Final Admin module navigation/data binding fix */
(()=>{'use strict';
const CORE=['dash','apps','approval','customers','repay','payments','transactions','overdue','staff','withdrawals'];
const MODULES=['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'];
let busy=false;
async function refreshData(){
  if(busy)return;
  busy=true;
  try{
    if(window.hfyAdminReady){const ok=await window.hfyAdminReady;if(!ok)return;}
    if(typeof window.loadData==='function') await window.loadData();
    else if(typeof window.__hfyAdminModulesReady!=='undefined'&&typeof window.renderPanel==='function'){}
  }catch(e){console.error('HFY final module refresh',e)}
  finally{busy=false}
}
function activate(id,el){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  const p=document.getElementById(id);if(p)p.classList.add('on');
  document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
  if(el)el.classList.add('on');
}
async function openModule(id,el){
  activate(id,el);
  await refreshData();
  try{
    if(CORE.includes(id)&&typeof window.renderCore==='function') window.renderCore();
    if(id==='apps'&&typeof window.loadApplications==='function') await window.loadApplications();
    if(MODULES.includes(id)&&typeof window.renderPanel==='function') window.renderPanel(id);
    if(id==='withdrawals'&&typeof window.renderWithdrawals==='function') window.renderWithdrawals();
  }catch(e){console.error('HFY final module render',id,e)}
}
function bind(){
  document.querySelectorAll('.side .m').forEach(el=>{
    const raw=el.getAttribute('onclick')||'';
    const m=raw.match(/show\(['"]([^'"]+)['"]/);
    if(!m)return;
    const id=m[1];
    el.onclick=function(ev){if(ev)ev.preventDefault();openModule(id,el);return false};
  });
}
async function boot(){
  bind();
  await refreshData();
  const active=document.querySelector('.panel.on')?.id||'dash';
  const el=[...document.querySelectorAll('.side .m')].find(x=>(x.textContent||'').includes(active==='dash'?'Dashboard':'___'));
  try{
    if(CORE.includes(active)&&typeof window.renderCore==='function')window.renderCore();
    if(MODULES.includes(active)&&typeof window.renderPanel==='function')window.renderPanel(active);
  }catch(e){console.error(e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();