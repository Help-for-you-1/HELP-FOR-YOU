/* HELP FOR YOU — Keep current Admin section after browser refresh only */
(()=>{
'use strict';
const KEY='hfy_admin_current_section_v2';
let restoring=false;
const getSaved=()=>{try{return sessionStorage.getItem(KEY)}catch(e){return null}};
const setSaved=id=>{try{sessionStorage.setItem(KEY,String(id))}catch(e){}};
function findButton(id){
 return [...document.querySelectorAll('.m')].find(x=>{
  const o=x.getAttribute('onclick')||'';
  return o.includes("show('"+id+"'")||o.includes('show("'+id+'"');
 })||null;
}
function restore(){
 if(restoring)return;
 const id=getSaved();
 if(!id||!document.getElementById(id))return;
 const btn=findButton(id);
 if(!btn)return;
 restoring=true;
 try{
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on');
  if(typeof window.renderPanel==='function'&&['loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings'].includes(id))window.renderPanel(id);
  else if(typeof window.renderCore==='function'&&['dash','customers','approval','repay'].includes(id))window.renderCore();
  else if(id==='payments'&&typeof window.renderPayments==='function')window.renderPayments();
  else if(id==='transactions'&&typeof window.renderTransactions==='function')window.renderTransactions();
  else if(id==='overdue'&&typeof window.renderOverdue==='function')window.renderOverdue();
  else if(id==='staff'&&typeof window.renderStaff==='function')window.renderStaff();
  else if(id==='withdrawals'&&typeof window.renderWithdrawals==='function')window.renderWithdrawals();
  else if(id==='apps'&&typeof window.loadApplications==='function')window.loadApplications();
 }catch(e){console.error('HFY refresh restore',e)}
 setTimeout(()=>{restoring=false},150);
}
function bind(){
 if(typeof window.show!=='function'){setTimeout(bind,100);return}
 if(!window.__HFY_REFRESH_WRAPPED){
  const original=window.show;
  window.show=function(id,b){
   if(!restoring)setSaved(id);
   return original.apply(this,arguments);
  };
  window.__HFY_REFRESH_WRAPPED=true;
 }
 restore();
 [300,800,1500,2500,4000].forEach(t=>setTimeout(restore,t));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
else setTimeout(bind,0);
})();
