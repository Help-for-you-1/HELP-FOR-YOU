(()=>{
'use strict';
const logo='hfy-logo.svg';
function installNoc(){
 const fn=window.hfyPrintNOC;
 if(typeof fn!=='function'||fn.__hfyNocLogo)return false;
 const wrapped=function(){
  const nativeOpen=window.open;
  window.open=function(...args){
   const w=nativeOpen.apply(window,args);
   if(w){
    try{
     const nativeWrite=w.document.write.bind(w.document);
     w.document.write=function(html){
      let s=String(html||'');
      if(/NO\s+OBJECTION\s+CERTIFICATE/i.test(s)&&!s.includes('hfy-noc-logo')){
       const block='<div id="hfy-noc-logo" style="display:flex;align-items:center;justify-content:center;margin:0 0 16px;padding:0 0 12px;border-bottom:2px solid #0b55ad"><img src="'+logo+'" alt="HELP FOR YOU" style="width:82px;height:82px;object-fit:contain;display:block"></div>';
       s=s.replace(/<div class="cert">/i,'<div class="cert">'+block);
      }
      return nativeWrite(s);
     };
    }catch(e){}
   }
   return w;
  };
  try{return fn.apply(this,arguments);}finally{window.open=nativeOpen;}
 };
 wrapped.__hfyNocLogo=true;
 window.hfyPrintNOC=wrapped;
 return true;
}
let tries=0;
const timer=setInterval(()=>{if(installNoc()||++tries>200)clearInterval(timer)},100);
installNoc();
})();
