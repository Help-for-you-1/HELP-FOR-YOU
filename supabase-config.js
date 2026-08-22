// HELP FOR YOU — Supabase client configuration
window.HFY_SUPABASE_URL = "https://bvyruwvvlubgqficjblq.supabase.co";
window.HFY_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tet-jboVRqYRD5DpaQYAHw_XT-Er47t";

// Keep the existing Admin page/options unchanged.
(function(){
  if(location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')){
    var oldAlert=window.alert;
    window.alert=function(msg){
      if(typeof msg==='string' && msg.indexOf('Supabase connection/data load error:')===0) return;
      return oldAlert.apply(window,arguments);
    };
    function add(src){var s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);}
    add('admin-master.js?v=20260822-2');
    add('admin-approval-fix.js?v=20260822-2');
    add('emi-view-fix.js?v=20260822-2');
    add('admin-final-fix.js?v=20260822-4');
    setTimeout(function(){
      add('admin-final-fix.js?v=20260822-4-late');
      add('emi-action-fix.js?v=20260822-1');
    },1500);
    setTimeout(function(){
      add('emi-action-fix.js?v=20260822-1-late');
    },3000);
    setTimeout(function(){
      add('emi-final-fix.js?v=20260822-1');
    },4500);
    setTimeout(function(){
      add('admin-final-fix.js?v=20260822-4-final');
    },6000);
    // Customer/Approval fix is loaded last. EMI code is not changed.
    setTimeout(function(){
      add('admin-customer-fix.js?v=20260822-1');
    },7000);
    setTimeout(function(){if(window.hfyMasterBoot)window.alert=oldAlert;},9000);
  }
})();
