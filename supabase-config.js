// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = "https://bvyruwvvlubgqficjblq.supabase.co";
window.HFY_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47t";

// Keep the existing Admin page/options unchanged.
// Load only the existing runtime/fix scripts needed by Admin.
(function(){
  if(location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')){
    var oldAlert=window.alert;
    window.alert=function(msg){
      if(typeof msg==='string' && msg.indexOf('Supabase connection/data load error:')===0) return;
      return oldAlert.apply(window,arguments);
    };

    var s=document.createElement('script');
    s.src='admin-master.js?v=20260822-2';
    s.defer=true;
    document.head.appendChild(s);

    var a=document.createElement('script');
    a.src='admin-approval-fix.js?v=20260822-2';
    a.defer=true;
    document.head.appendChild(a);

    var e=document.createElement('script');
    e.src='emi-view-fix.js?v=20260822-2';
    e.defer=true;
    document.head.appendChild(e);

    setTimeout(function(){ if(window.hfyMasterBoot) window.alert=oldAlert; },5000);
  }
})();
