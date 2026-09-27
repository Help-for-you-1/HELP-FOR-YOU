/* HELP FOR YOU — Dynamic site logo loader */
(function(){
'use strict';
var fallback='hfy-logo.svg';
window.HFY_LOGO_URL=window.HFY_LOGO_URL||fallback;
function apply(url){
 if(!url)return;
 window.HFY_LOGO_URL=url;
 document.querySelectorAll('img[src*="hfy-logo.svg"],img[data-hfy-logo]').forEach(function(img){img.src=url;});
}
window.HFY_LOGO_READY=(async function(){
 try{
  var sb=window.supabase.createClient(window.HFY_SUPABASE_URL,window.HFY_SUPABASE_PUBLISHABLE_KEY);
  var r=await sb.from('hfy_app_settings').select('value').eq('key','logo_url').maybeSingle();
  if(!r.error&&r.data&&r.data.value){
   var v=String(r.data.value);
   if(/^https?:\/\//i.test(v))apply(v);
   else if(v==='hfy-logo.svg')apply(fallback);
   else apply(sb.storage.from('hfy-assets').getPublicUrl(v).data.publicUrl);
  }
 }catch(e){console.error('HFY logo load:',e)}
 return window.HFY_LOGO_URL;
})();
window.HFY_APPLY_LOGO=apply;
})();