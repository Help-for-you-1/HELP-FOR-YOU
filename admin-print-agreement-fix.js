(()=>{
'use strict';
const originalOpen=window.hfyOpenAgreement;
if(typeof originalOpen!=='function')return;
window.hfyOpenAgreement=async function(id){
  await originalOpen(id);
  setTimeout(()=>{
    const emi=document.getElementById('pro_emi_amount');
    const daily=document.getElementById('pro_daily_emi');
    if(emi&&daily&&daily.value) emi.value=daily.value;
    const rate=document.getElementById('pro_interest_rate');
    if(rate&&rate.value&&!String(rate.value).includes('%')) rate.value=String(rate.value)+'%';
    const tenure=document.getElementById('pro_tenure_months');
    if(tenure&&tenure.value&&!/month/i.test(tenure.value)) tenure.value=String(tenure.value)+' Month';
  },50);
};
})();
