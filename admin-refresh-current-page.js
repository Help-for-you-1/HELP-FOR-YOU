(()=>{
'use strict';
const KEY='hfy_admin_current_section';
function bind(){
  const original=window.show;
  if(typeof original!=='function')return;
  window.show=function(id,b){
    try{sessionStorage.setItem(KEY,String(id));}catch(e){}
    return original.apply(this,arguments);
  };
  let saved=null;
  try{saved=sessionStorage.getItem(KEY);}catch(e){}
  if(saved && document.getElementById(saved)){
    setTimeout(()=>{
      const item=[...document.querySelectorAll('.m')].find(x=>{
        const o=x.getAttribute('onclick')||'';
        return o.includes("show('"+saved+"'") || o.includes('show("'+saved+'"');
      });
      window.show(saved,item||null);
    },100);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,0));else setTimeout(bind,0);
})();
