(()=>{
'use strict';
const nativeOpen=window.open;
window.open=function(...args){
 const w=nativeOpen.apply(window,args);
 if(!w)return w;
 try{
  if(w.__hfyLogoPatched)return w;
  w.__hfyLogoPatched=true;
  const doc=w.document;
  const oldWrite=doc.write.bind(doc);
  doc.write=function(html){
   let s=String(html||'');
   if(/HELP\s*FOR\s*YOU/i.test(s)&&!s.includes('hfy-print-logo')){
    const logo='<div class="hfy-print-logo"><img src="hfy-logo.svg" alt="HELP FOR YOU"><div><b>HELP FOR YOU</b><span>Loan Management & Financial Services</span></div></div>';
    s=s.replace(/<body([^>]*)>/i,'<body$1>'+logo);
    s=s.replace(/<style>/i,'<style>.hfy-print-logo{display:flex;align-items:center;justify-content:center;gap:12px;text-align:left;margin:0 0 18px;padding:0 0 12px;border-bottom:2px solid #0b55ad}.hfy-print-logo img{width:72px;height:72px;object-fit:contain}.hfy-print-logo b{display:block;font-size:22px;color:#0b55ad}.hfy-print-logo span{display:block;font-size:10px;color:#667085;margin-top:3px}@media print{.hfy-print-logo{margin-bottom:14px}}</style><style>');
   }
   return oldWrite(s);
  };
 }catch(e){console.error('HFY print logo patch error',e)}
 return w;
};
})();
