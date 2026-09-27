/* HELP FOR YOU — Keep current Admin section after browser refresh only */
(()=>{
'use strict';
const KEY='hfy_admin_current_section';
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
 try{sessionStorage.removeItem(KEY)}catch(e){}
 return;
 /*
 if(restoring)return;
 const id=getSaved();
 if(!id||!document.getElementById(id))return;
 const btn=findButton(id);
 if(!btn)return;
 restoring=true;
 try{
  if(id==='dash'){
   document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));
   document.getElementById('dash').classList.add('on');
   document.querySelectorAll('.side .m').forEach(x=>x.classList.remove('on'));
   btn.classList.add('on');
   if(typeof window.renderFinalDashboard==='function')setTimeout(()=>window.renderFinalDashboard(),50);
  }else if(typeof window.show==='function'){
   window.show(id,btn);
  }
 }catch(e){console.error('HFY refresh restore',e)}
 setTimeout(()=>{restoring=false},150);
 */
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
