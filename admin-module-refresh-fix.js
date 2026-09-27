/* HELP FOR YOU — Admin module refresh */
(function(){
'use strict';
function boot(){
  try{
    const ids=['reports','loanaccounts','autopay','collections','risk','documents','accounting','audit','notifications','settings','withdrawals'];
    const oldShow=window.show;
    if(typeof oldShow!=='function') return;
    window.show=function(id,b){
      oldShow(id,b);
      if(ids.includes(id)){
        setTimeout(()=>{try{
          if(typeof window.renderPanel==='function') window.renderPanel(id);
          if(id==='withdrawals'&&typeof window.renderWithdrawals==='function') window.renderWithdrawals();
        }catch(e){console.error(e)}},50);
      }
    };
    setTimeout(()=>{
      try{ids.forEach(id=>{if(typeof window.renderPanel==='function')window.renderPanel(id)});if(typeof window.renderWithdrawals==='function')window.renderWithdrawals()}catch(e){console.error(e)}
    },3500);
  }catch(e){console.error('HFY module refresh',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();