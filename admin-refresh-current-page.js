(()=>{
'use strict';
const KEY='hfy_admin_current_section';
let restoring=false;
function getSaved(){try{return sessionStorage.getItem(KEY)}catch(e){return null}}
function setSaved(id){try{sessionStorage.setItem(KEY,String(id))}catch(e){}}
function findButton(id){return [...document.querySelectorAll('.m')].find(x=>{const o=x.getAttribute('onclick')||'';return o.includes("show('"+id+"'")||o.includes('show(\"'+id+'\"')})||null}
function restore(){
  if(restoring)return;
  const id=getSaved();
  if(!id||id==='dash'||!document.getElementById(id))return;
  const btn=findButton(id);
  if(!btn)return;
  restoring=true;
  try{if(typeof window.show==='function')window.show(id,btn);}catch(e){}
  setTimeout(()=>{restoring=false},80);
}
function bind(){
  if(typeof window.show!=='function'){setTimeout(bind,100);return}
  const original=window.show;
  if(!window.__HFY_REFRESH_WRAPPED){
    window.show=function(id,b){
      if(!restoring)setSaved(id);
      return original.apply(this,arguments);
    };
    window.__HFY_REFRESH_WRAPPED=true;
  }
  restore();
  [250,600,1200,2000,3000].forEach(t=>setTimeout(restore,t));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else setTimeout(bind,0);
})();
