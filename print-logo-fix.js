(()=>{
'use strict';
const logo=()=>{try{return new URL('hfy-logo.svg',location.href).href}catch(e){return 'hfy-logo.svg'}};
const block=()=>'<div id="hfy-print-logo" style="position:absolute;left:24px;top:18px;width:90px;height:90px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:9999"><img src="'+logo()+'" alt="HELP FOR YOU" style="width:90px;height:90px;object-fit:contain;display:block"></div>';
const agreementLogo=()=>'<div id="hfy-print-logo" style="position:absolute;left:50%;top:10px;transform:translateX(-50%);width:96px;height:96px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:10"><img src="'+logo()+'" alt="HELP FOR YOU" style="width:96px;height:96px;object-fit:contain;display:block"></div>';
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
     const isAgreement=/SANCTION-CUM-LOAN AGREEMENT|LOAN AGREEMENT|OFFICIAL LOAN AGREEMENT/i.test(s);
     const isStatement=/CUSTOMER REPAYMENT STATEMENT|CUSTOMER LOAN REPAYMENT STATEMENT/i.test(s);
     if(isAgreement){
      s=s.replace(/<style>/i,'<style>.header,.head{position:relative!important;min-height:122px!important;padding-top:108px!important;padding-bottom:12px!important}.header .brand,.header .tag,.header .docmeta,.head .brand,.head .sub,.head .badge{position:relative;z-index:1}.header #hfy-print-logo,.head #hfy-print-logo{top:8px!important}</style>');
      if(/<div class="header">/i.test(s))s=s.replace(/<div class="header">/i,'<div class="header">'+agreementLogo());
      else if(/<header class="head">/i.test(s))s=s.replace(/<header class="head">/i,'<header class="head">'+agreementLogo());
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
