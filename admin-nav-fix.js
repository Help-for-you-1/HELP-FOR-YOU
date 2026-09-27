/* HELP FOR YOU — Admin navigation/runtime safety fix */
(()=>{'use strict';
function activate(id,el){
 document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
 const p=document.getElementById(id);
 if(p)p.classList.add('on');
 document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
 if(el)el.classList.add('on');
}
function bind(){
 document.querySelectorAll('.side .m').forEach(el=>{
  const raw=el.getAttribute('onclick')||'';
  const m=raw.match(/show\(['"]([^'"]+)['"]/);
  if(!m)return;
  const id=m[1];
  el.onclick=function(ev){
   if(ev)ev.preventDefault();
   activate(id,el);
   try{
    if(id==='reports'&&typeof window.renderMIS==='function')window.renderMIS();
    if(['loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].includes(id)&&typeof window.renderPanel==='function')window.renderPanel(id);
    if(id==='withdrawals'&&typeof window.renderWithdrawals==='function')window.renderWithdrawals();
    if(id==='payments'&&typeof window.renderPayments==='function')window.renderPayments();
    if(id==='transactions'&&typeof window.renderTransactions==='function')window.renderTransactions();
    if(id==='overdue'&&typeof window.renderOverdue==='function')window.renderOverdue();
    if(id==='staff'&&typeof window.renderStaff==='function')window.renderStaff();
    if(id==='customers'&&typeof window.render==='function')window.render();
    if(id==='apps'&&typeof window.render==='function')window.render();
    if(id==='approval'&&typeof window.render==='function')window.render();
    if(id==='repay'&&typeof window.render==='function')window.render();
   }catch(e){console.error('HFY Admin option error',id,e);}
   return false;
  };
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();