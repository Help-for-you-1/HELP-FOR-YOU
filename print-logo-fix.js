(()=>{
'use strict';
const logo=()=>{try{return new URL('hfy-logo.svg',location.href).href}catch(e){return 'hfy-logo.svg'}};
const block=()=>'<div id="hfy-print-logo" style="position:absolute;left:24px;top:18px;width:90px;height:90px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:9999"><img src="'+logo()+'" alt="HELP FOR YOU" style="width:90px;height:90px;object-fit:contain;display:block"></div>';
const agreementLogo=()=>'<div id="hfy-print-logo" style="position:absolute;left:50%;top:8px;transform:translateX(-50%);width:112px;height:112px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:5"><img src="'+logo()+'" alt="HELP FOR YOU" style="width:112px;height:112px;object-fit:contain;display:block"></div>';
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
     const isStatement=/CUSTOMER REPAYMENT STATEMENT|CUSTOMER LOAN REPAYMENT STATEMENT/i.test(s);
     if(isAgreement){
      s=s.replace(/<style>/i,'<style>.header{position:relative;min-height:126px!important;padding-top:18px!important;padding-bottom:14px!important}.header .brand,.header .tag{position:relative;z-index:1}.header .docmeta{position:relative;z-index:1;padding-top:2px}.header #hfy-print-logo{top:7px!important}</style>');
      s=s.replace(/<div class="header">/i,'<div class="header">'+agreementLogo());
     }else if(!isStatement){
      s=s.replace(/<body([^>]*)>/i,'<body$1>'+block());
     }
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
