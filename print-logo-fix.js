(()=>{
'use strict';
const logo=()=>{try{return new URL('hfy-logo.svg',location.href).href}catch(e){return 'hfy-logo.svg'}};
const block=()=>'<div id="hfy-print-logo" style="position:absolute;left:24px;top:18px;width:90px;height:90px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:9999"><img src="'+logo()+'" alt="HELP FOR YOU" style="width:90px;height:90px;object-fit:contain;display:block"></div>';
const agreementBlock=()=>'<div id="hfy-print-logo" style="text-align:center;padding:4px 0 7px;pointer-events:none"><img src="'+logo()+'" alt="HELP FOR YOU" style="width:90px;height:90px;object-fit:contain;display:inline-block"></div>';
function installPrintLogo(){
 if(window.__hfyPrintLogoInstalled)return true;
 const nativeOpen=window.open;
 window.open=function(...args){
  const w=nativeOpen.apply(window,args);
  if(!w)return w;
  try{
   const nativeWrite=w.document.write.bind(w.document);
   w.document.write=function(html){
    let s=String(html||'');
    if(/<body\b/i.test(s)&&!s.includes('hfy-print-logo')&&!s.includes('hfy-noc-logo')){
     const isAgreement=/SANCTION-CUM-LOAN AGREEMENT|LOAN AGREEMENT/i.test(s);
     s=s.replace(/<body([^>]*)>/i,'<body$1>'+(isAgreement?agreementBlock():block()));
    }
    return nativeWrite(s);
   };
  }catch(e){}
  return w;
 };
 window.__hfyPrintLogoInstalled=true;
 return true;
}
installPrintLogo();
})();
