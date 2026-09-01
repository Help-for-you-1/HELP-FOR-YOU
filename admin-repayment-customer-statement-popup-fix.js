(()=>{
'use strict';
let original=null;
function install(){
  if(typeof window.hfyOpenCustomerStatement!=='function'||window.hfyOpenCustomerStatement.__popupFixed)return false;
  original=window.hfyOpenCustomerStatement;
  const fixed=async function(cid,lid){
    const popup=window.open('','_blank');
    if(!popup){alert('Please allow pop-ups to view the statement.');return;}
    try{
      popup.document.open();
      popup.document.write('<!doctype html><html><body style="font-family:Arial;padding:30px"><h2>HELP FOR YOU</h2><p>Loading customer statement…</p></body></html>');
      popup.document.close();
      const realOpen=window.open;
      window.open=function(){return popup};
      try{await original(cid,lid)}finally{window.open=realOpen}
      try{popup.focus()}catch(e){}
    }catch(e){try{popup.close()}catch(x){};console.error(e);alert('Statement could not be opened: '+(e?.message||e))}
  };
  fixed.__popupFixed=true;
  window.hfyOpenCustomerStatement=fixed;
  return true;
}
let tries=0;const t=setInterval(()=>{if(install()||++tries>80)clearInterval(t)},250);
})();
