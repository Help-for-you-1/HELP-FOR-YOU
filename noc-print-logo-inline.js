(()=>{
'use strict';
const logoSvg='hfy-logo.svg';
const install=()=>{
 const original=window.hfyPrintNOC;
 if(typeof original!=='function'||original.__hfyInlineLogo)return false;
 const wrapped=function(){
  const oldOpen=window.open;
  let target=null;
  window.open=function(...args){
   target=oldOpen.apply(window,args);
   if(target){
    try{
     const oldWrite=target.document.write.bind(target.document);
     target.document.write=function(html){
      let s=String(html||'');
      if(/NO OBJECTION CERTIFICATE/i.test(s)&&!s.includes('hfy-noc-logo')){
       const logo='<div id="hfy-noc-logo" style="display:flex;align-items:center;justify-content:center;margin:0 0 16px;padding:0 0 12px;border-bottom:2px solid #0b55ad"><img src="'+logoSvg+'" alt="HELP FOR YOU" style="width:78px;height:78px;object-fit:contain;display:block"></div>';
       s=s.replace(/<div class="cert">/i,'<div class="cert">'+logo);
      }
      return oldWrite(s);
     };
    }catch(e){}
   }
   return target;
  };
  try{return original.apply(this,arguments);}finally{window.open=oldOpen;}
 };
 wrapped.__hfyInlineLogo=true;
 window.hfyPrintNOC=wrapped;
 return true;
};
let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},100);
install();
})();
